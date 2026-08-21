import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { Alert, Box, FormControlLabel, Grid, Snackbar, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Download, Home, Language, Mail, Phone, SaveOutlined, WhatsApp } from '@mui/icons-material';
import moment from 'moment';

import CoresList from 'src/components/cores/CoresList';
import CoreReportDetail from 'src/components/cores/CoreReportDetail';

import { getStudent } from 'db/student';
import { getObservationsByStudent } from 'db/observation';
import { getInstitution } from 'db/institution';
import { getOrCreateStudentLastReport } from 'db/report';
import { getInstitutionCoordinators, getInstitutionPrincipals } from 'db/user';
import { getReportOptionsForStudentAndClassroom } from 'db/reportsOptions';
import { getCoresByScope, getScopesObjectWithStrings } from 'src/helpers/businessLogic';
import { UserContext } from 'src/context/UserContext';
import axios from 'axios';
import { MixpanelContext } from 'services/MixpanelContext';
import { isAuthorized } from 'services/Authorization';
import Head from 'next/head';
import LevelsOfAchievementDescription from 'src/components/levelsOfAchievement/DescriptionsForReport';
import UngaRatioImage from 'src/components/utils/UngaRatioImage';
import { AdvancedReportContext } from 'src/context/AdvancedReportContext';
import ReportService from 'services/Report';
import FeaturedObservations from 'src/components/observations/FeaturedObservations';
import PrintReport from 'src/components/report/Print';
import { getAttendanceByStudentAndDatesForInstitution } from 'db/attendance';
import { getAttendanceAnalyticsByDateAndMonth } from 'services/attendance';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import StudentAttendanceHeatMap from 'src/components/attendance/StudentAttendanceHeatMap';
import Signatures from 'src/components/utils/Signatures';
import { useInterval } from 'src/hooks/useInterval';
import AdvancementCalculationService from 'services/AdvancementCalculationService';
import { useReactToPrint } from 'react-to-print';
import PlansService from 'services/PlansService';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.INSTITUTIONAL_ONLY);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);
  const {
    user,
    user: {
      institution: { id: institutionId },
      class: _class,
    },
  } = session;
  const { params: { classroomId, studentId } } = context;
  const student = await getStudent(studentId);
  const updatedInstitution = await getInstitution(institutionId);
  const reportService = await ReportService.initializeService(institutionId, classroomId, studentId);
  const cores = await reportService.coresWithAdvancement();
  const activeTimePeriods = reportService.getActiveTimePeriods();
  const getStartOfYearMoment = reportService.getStartOfYearMoment();
  const classroomReportConfiguration = reportService.getClassroomReportConfiguration();
  const observations = await getObservationsByStudent(studentId);
  const report = await getOrCreateStudentLastReport(studentId, classroomId, user.id);
  const principals = await getInstitutionPrincipals(institutionId);
  const coordinators = await getInstitutionCoordinators(institutionId);
  const reportOptions = await getReportOptionsForStudentAndClassroom(studentId, classroomId, institutionId);

  const attendanceStartDate = getStartOfYearMoment.format('YYYY-MM-DD');
  let attendanceEndDate = null;
  const endOfYear = getStartOfYearMoment.endOf('year');
  if (endOfYear.isAfter(moment())) {
    attendanceEndDate = moment().format('YYYY-MM-DD');
  } else {
    attendanceEndDate = endOfYear.format('YYYY-MM-DD');
  }
  const attendance = await getAttendanceByStudentAndDatesForInstitution(
    studentId,
    institutionId,
    attendanceStartDate,
    attendanceEndDate,
  );

  const attendanceByDateAndMonth = getAttendanceAnalyticsByDateAndMonth(
    attendance || [],
    attendanceStartDate,
    attendanceEndDate,
  );

  const classroom = report.classroom;
  const mainTeacher = classroom.mainTeacher || null;

  return {
    props: serializeForNextProps({
      cores: cores.filter((core) => !core.hide),
      student,
      observations,
      report,
      classroom,
      mainTeacher,
      institution: updatedInstitution,
      currentUser: user,
      principal: principals.length > 0 ? principals[0] : null,
      coordinator: coordinators.length > 0 ? coordinators[0] : null,
      reportOptions,
      attendanceByDate: attendanceByDateAndMonth.analyticsByDate,
      activeTimePeriods,
      classroomReportConfiguration,
    }),
  };
}

export default function Report({
  cores,
  observations,
  report,
  classroom,
  mainTeacher,
  institution,
  currentUser,
  principal,
  coordinator,
  reportOptions,
  attendanceByDate,
  activeTimePeriods,
  classroomReportConfiguration,
  student,
}) {
  const AUTOSAVE_INTERVAL = 20000;
  const printButtonRef = useRef();
  const { levelsOfAchievement } = useContext(UserContext);
  const { trackGenerateReport, trackDownloadReport, trackSaveReport } = useContext(MixpanelContext);
  const {
    setReportOptions,
    setLevelNotToShow,
    setPrinting,
    printing,
    setActiveTimePeriods,
    setClassroomReportConfiguration,
    hiddenObjectives,
    showSubObjectives,
    setShowSubObjectives,
    setStudent,
    evaluatedObjective,
    setEvaluatedObjective,
  } = useContext(AdvancedReportContext);
  const [summaryText, setSummaryText] = useState(report?.summary || '');
  const [descriptionByScope, setDescriptionByScope] = useState(
    report?.descriptionByScope || getScopesObjectWithStrings(institution.methodology)
  );
  // const [PDFGenerationLoading, setPDFGenerationLoading] = useState(false);
  const [saveChangesLoading, setSaveChangesLoading] = useState(false);
  const [saveChangesError, setSaveChangesError] = useState(false);
  const [saveChangesSuccess, setSaveChangesSuccess] = useState(false);
  const [selectedObservationsByCore, setSelectedObservationsByCore] = useState(report.observationsByCore || {})
  const [mainTab, setMainTab] = useState('summary');
  const [coreTab, setCoreTab] = useState(0);
  const [reportUrl, setReportUrl] = useState('');
  const reportContainerRef = useRef();
  const timePeriods = useMemo(() => Object.values(activeTimePeriods), [activeTimePeriods]);
  const reportDate = useMemo(() => moment(), [])

  useEffect(() => {
    setReportOptions(reportOptions);
    setActiveTimePeriods(activeTimePeriods);
    setClassroomReportConfiguration(classroomReportConfiguration);
    setStudent(student);
  }, [reportOptions, activeTimePeriods, classroomReportConfiguration]);

  useEffect(() => {
    setLevelNotToShow(classroom.level.id);
    // trackGenerateReport(student.fullName, classroom.name)
    return () => {
      setLevelNotToShow('null');
    }
  }, [])

  const signers = useMemo(() => institution.configuration?.report?.signers, [institution]);

  const changeEvaluatedObjectiveInCores = (evaluatedObjective, cores) => {
    const { objectiveId, levelOfAchievement, timePeriodName, coreId } = evaluatedObjective;
    const coreIndex = cores.findIndex((core) => core.id === coreId);
    const newCore = { ...cores[coreIndex] };
    const objectiveIndex = newCore.objectives[timePeriodName].findIndex((objective) => objective.id === objectiveId);
    const newObjective = { ...newCore.objectives[timePeriodName][objectiveIndex] };
    newObjective.levelOfAchievement = levelOfAchievement;
    newCore.objectives[timePeriodName][objectiveIndex] = newObjective;
    cores[coreIndex] = newCore;
    setEvaluatedObjective(null);
  }

  const coresWithAdvancement = useMemo(() => {
    if (evaluatedObjective) {
      changeEvaluatedObjectiveInCores(evaluatedObjective, cores);
    }
    return cores.map((core) => AdvancementCalculationService.addAdvancementDataToCoreByTimePeriod(
      core,
      levelsOfAchievement,
      hiddenObjectives,
    ))
  }, [cores, hiddenObjectives, evaluatedObjective]);

  const coresByScopes = useMemo(() => (
    getCoresByScope(coresWithAdvancement, institution.methodology)
  ), [coresWithAdvancement])

  const handleSummaryText = ({ target: { value } }) => setSummaryText(value);

  const handleScopeText = ({ target: { value, name } }) => {
    const newScopesTexts = { ...descriptionByScope };
    newScopesTexts[name] = value;
    setDescriptionByScope(newScopesTexts);
  };

  const handleObservationSelection = (coreId, selectedObservations) => {
    const newSelectedObservationsByCore = { ...selectedObservationsByCore };
    newSelectedObservationsByCore[coreId] = selectedObservations;
    setSelectedObservationsByCore(newSelectedObservationsByCore);
  }

  const handleSaveChanges = ({ showState = true, download = false }) => {
    if (showState) {
      setSaveChangesSuccess(false);
      setSaveChangesError(false);
      setSaveChangesLoading(true);
    }
    const studentId = student.id;
    const observationsIdsByCore = {};
    Object.entries(selectedObservationsByCore).forEach(([coreId, observations]) => {
      observationsIdsByCore[coreId] = observations.map((observation) => observation.id);
    })
    axios.patch(`/api/classrooms/${classroom.id}/students/${studentId}/reports/${report.id}`, {
      summary: summaryText,
      descriptionByScope,
      observationsByCore: observationsIdsByCore,
      download,
    })
      .then(() => {
        // trackSaveReport(
        //   classroom.name,
        //   student.fullName,
        // );
        if (showState) {
          setSaveChangesLoading(false);
          setSaveChangesError(false);
          setSaveChangesSuccess(true);
        }
      })
      .catch(() => {
        if (showState) {
          setSaveChangesError(true);
          setSaveChangesLoading(false);
        }
      })
  };

  useInterval(() => handleSaveChanges({ showState: false }), AUTOSAVE_INTERVAL);

  // const print = useReactToPrint({
  //   content: () => reportContainerRef.current,
  //   documentTitle: `Informe de ${student.data.fullName}.pdf`,
  // });

  const print = useReactToPrint({
    content: () => reportContainerRef.current,
    documentTitle: `Informe de ${student.fullName}.pdf`,
    print: async (printIframe) => {
      printIframe.contentWindow.print();
      const document = printIframe.contentDocument;
      if (document) {
        // trackDownloadReport(student.fullName, student.class.name)
        const html = document.getElementsByTagName('html')[0];
        const emptyStyleElements = html.querySelectorAll('style:empty[id]');
        // Remove the empty style elements from the container
        emptyStyleElements.forEach(styleElement => {
          styleElement.parentNode.removeChild(styleElement);
        });
        const institutionId = institution.id;
        const classroomId = classroom.id;
        const studentId = student.id;
        axios.post(`/api/institutions/${institutionId}/classrooms/${classroomId}/students/${studentId}/reports`,
          {
            savePDF: true,
            html: html.outerHTML,
            timePeriods,
            advancementByCore: coresWithAdvancement.map((core) => ({
              id: core.id,
              name: core.name,
              advancement: core.advancement,
            })),
          })

        // setReportUrl(response.data.secure_url);
      }
      setPrinting(false);
    },
  });

  const transformCanvasToImage = () => {
    const canvas = document.getElementById('attendance-matrix-canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const canvasImage = document.createElement('img');
    canvasImage.src = dataUrl;
    canvasImage.style.width = canvas.style.width;
    canvasImage.style.height = canvas.style.height;
    canvas.parentNode.replaceChild(canvasImage, canvas);
  }

  const handleReportDownload = () => {
    transformCanvasToImage();
    print();
  }

  const handleSetPrinting = () => {
    handleSaveChanges({ showState: false, download: true });
    setPrinting(true);
  }

  const handleSnackbarClose = () => {
    setSaveChangesLoading(false);
    setSaveChangesError(false);
    setSaveChangesSuccess(false);
  };

  const handleMainTabChange = (_, newValue) => {
    setMainTab(newValue);
    setCoreTab(0);
  };

  const handleCoreTabChange = (_, newValue) => {
    setCoreTab(newValue);
  };

  const getBirthAndAge = () => {
    if (!student.birthDate) return null;

    const birthDate = student.birthDate;
    const normalizedBirthDate = moment.utc(birthDate);
    const years = reportDate.diff(normalizedBirthDate, 'years')
    const months = reportDate.diff(normalizedBirthDate, 'months') - 12 * years;
    let yearsText = 'años y ';
    let monthsText = 'meses';
    if (years === 1) yearsText = 'año y ';
    if (months === 1) monthsText = 'mes';
    return (
      <>
        <Typography>
          Fecha de nacimiento: {normalizedBirthDate.format('DD [de] MMMM [de] YYYY')}
        </Typography>
        <Typography>
          Edad: {years} {yearsText} {months} {monthsText}
        </Typography>
      </>
    )
  }

  return (
    <>
      <Head><title>Informe de {student.fullName}</title></Head>
      {printing ? (
        <Box sx={{ backgroundColor: 'white' }} ref={reportContainerRef}>
          <PrintReport
            student={student}
            institution={institution}
            signers={signers}
            mainTeacher={mainTeacher}
            coresWithAdvancement={coresWithAdvancement}
            coresByScopes={coresByScopes}
            descriptionByScope={descriptionByScope}
            timePeriods={timePeriods}
            summaryText={summaryText}
            observationsByCore={selectedObservationsByCore}
            currentUser={currentUser}
            principal={principal}
            coordinator={coordinator}
            level={classroom?.level?.name}
            attendanceByDate={attendanceByDate}
            onFinishRender={handleReportDownload}
            classroomReportConfiguration={classroomReportConfiguration}
            reportDate={reportDate}
            printing={printing}
          />
        </Box>
      ) : (
        <Box>
          <TutorialLink id="2c5aa5b5e1dc441587cbcc7b31d0f97d" />
          <Box mb={4}>
            <Stack direction="row" spacing={2} my={2} justifyContent={{ xs: 'center', sm: 'flex-end' }}>
              <LoadingButton
                endIcon={<Download />}
                variant="outlined"
                onClick={handleSetPrinting}
                ref={printButtonRef}
              >
                Descargar
              </LoadingButton>
              <LoadingButton
                onClick={handleSaveChanges}
                endIcon={<SaveOutlined />}
                loading={saveChangesLoading}
                loadingPosition="end"
                variant="contained"
              >
                Guardar
              </LoadingButton>
            </Stack>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={mainTab}
                onChange={handleMainTabChange}
                aria-label="Tabs del informe"
                variant="scrollable"
              >
                <Tab label="Resumen" value="summary" />
                {Object.keys(coresByScopes).map((scope) => (
                  <Tab label={scope} value={scope} key={scope} />
                ))}
                <Tab label="Firmas" value="signatures" />
              </Tabs>
            </Box>
            {mainTab === 'summary' && (
              <Box>
                <Grid container my={4}>
                  <Grid item xs={12}>
                    <Grid container>
                      <Grid item xs={6} display="flex" alignItems="center">
                        {institution.logo && (
                          <Box mb={2}>
                            <UngaRatioImage
                              image={institution.logo}
                              baseHeight={150}
                              borderRadius={5}
                              alt="institution logo"
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={6} display="flex" alignItems="center">
                        {student.profilePicture && (
                          <Box mb={2}>
                            <UngaRatioImage
                              borderRadius={5}
                              image={student.profilePicture}
                              baseHeight={150}
                              alt="student profile"
                            />
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack mb={4} spacing={0.5}>
                      <Typography variant="h6" mb={2}>
                        Datos del establecimiento
                      </Typography>
                      <Typography>
                        {institution.name}
                      </Typography>
                      {institution.socialReason && (
                        <Typography>
                          {institution.socialReason}
                        </Typography>
                      )}
                      {institution.code && (
                        <Typography>
                          Código R.B.D {institution.code}
                        </Typography>
                      )}
                      {institution.address && (
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Home />
                          <Typography>
                            {institution.address}
                          </Typography>
                        </Stack>
                      )}
                      {institution.email && (
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Mail />
                          <Typography>
                            {institution.email}
                          </Typography>
                        </Stack>
                      )}
                      {institution.mobilePhone && (
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <WhatsApp />
                          <Typography>
                            {institution.mobilePhone}
                          </Typography>
                        </Stack>
                      )}
                      {institution.phone && (
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Phone />
                          <Typography>
                            {institution.phone}
                          </Typography>
                        </Stack>
                      )}
                      {institution.webpage && (
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Language />
                          <Typography>
                            {institution.webpage}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack mb={4} spacing={0.5}>
                      <Typography variant="h6" mb={2}>
                        Información general
                      </Typography>
                      <Typography>
                        Nombre completo: {student.firstName} {student.lastName}
                      </Typography>
                      {getBirthAndAge()}
                      {classroom?.level?.name && (
                        <Typography>
                          Nivel: {classroom.level.name}
                        </Typography>
                      )}
                      {mainTeacher ? (
                        <Typography>
                          Nombre de la educadora: {mainTeacher.firstName} {mainTeacher.lastName}
                        </Typography>
                      ) : (
                        <Typography>
                          Sin educadora a cargo, asígnala en las configuraciones de la sala
                        </Typography>
                      )}
                      {classroomReportConfiguration.showTeam && (
                        <Typography>
                          Equipo pedagógico: {classroomReportConfiguration.team}
                        </Typography>
                      )}
                      {!classroomReportConfiguration.hideDate && (
                        <Typography>
                          Fecha creación del informe: {reportDate.format("DD [de] MMMM [de] YYYY")}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
                {classroomReportConfiguration.showAttendance && (
                  <Box mb={6}>
                    <Typography variant="h6" mb={2}>Asistencia</Typography>
                    <StudentAttendanceHeatMap attendanceAnalyticsByDate={attendanceByDate} />
                  </Box>
                )}
                <Box mb={8}>
                  <Typography variant="h6" mb={2}>Descripción de los niveles de logro</Typography>
                  <LevelsOfAchievementDescription />
                </Box>
                {!institution.qualitativeOnly && (
                  <Box mb={8}>
                    <Typography variant="h6" mb={2}>
                      Resumen del avance de {student.firstName}
                    </Typography>
                    <CoresList cores={coresWithAdvancement} report />
                  </Box>
                )}
                <Box mb={8}>
                  <Stack spacing={2} alignItems="flex-start">
                    <Typography variant="h6">
                      Comentarios generales
                    </Typography>
                    {/* <Box>
              <Typography variant="subtitle2">¿Dónde quieres que se muestren estos comentarios?</Typography>
              <TextField
                select
                variant="outlined"
                value={generalCommentsPosition}
                onChange={handleGeneralCommentsPosition}
                size="small"
              >
                <MenuItem value='start'>
                  Al principio del informe
                </MenuItem>
                <MenuItem value='end'>
                  Al final del informe
                </MenuItem>
              </TextField>
            </Box> */}
                    <TextField
                      multiline
                      fullWidth
                      variant="outlined"
                      label={`Comentarios generales para ${student.firstName}`}
                      value={summaryText}
                      minRows={4}
                      maxRows={4}
                      onChange={handleSummaryText}
                    />
                  </Stack>
                </Box>
              </Box>
            )}
            {Object.entries(coresByScopes).filter(([scope, _]) => mainTab === scope).map(([scope, cores]) => (
              <Box mt={2} key={scope}>
                <Box mb={4}>
                  <Typography variant="h6" mb={2}>{scope}</Typography>
                  <TextField
                    multiline
                    fullWidth
                    variant="outlined"
                    label={`Comentarios cualitativos`}
                    value={descriptionByScope[scope]}
                    name={scope}
                    minRows={4}
                    maxRows={4}
                    onChange={handleScopeText}
                  />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} mb={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                  <Typography variant="h6">
                    Detalle por núcleo de aprendizaje
                  </Typography>
                  <FormControlLabel
                    sx={{ ml: 0 }}
                    control={
                      <Switch
                        checked={showSubObjectives}
                        onChange={({ target: { checked } }) => setShowSubObjectives(checked)}
                      />}
                    label="Mostrar indicadores de evaluación"
                    labelPlacement='start'
                  />
                </Stack>
                <Box mb={3} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={coreTab}
                    onChange={handleCoreTabChange}
                    aria-label="Tabs de núcleos"
                    variant="scrollable"
                  >
                    {cores.map((core) => (
                      <Tab label={core.name} key={core.id} />
                    ))}
                  </Tabs>
                </Box>
                {cores.filter((_, i) => i === coreTab).map((core) => {
                  const coreId = core.id;
                  const featuredIds = report.observationsByCore && report.observationsByCore[coreId] ?
                    report.observationsByCore[coreId].map((observation) => observation.id) :
                    [];
                  const featuredObservations = report.observationsByCore && report.observationsByCore[coreId] ?
                    report.observationsByCore[coreId] : [];
                  return (
                    <Box px={2} mb={12} key={core.id}>
                      <CoreReportDetail
                        qualitativeOnly={institution.qualitativeOnly}
                        core={core}
                        timePeriods={timePeriods}
                      />
                      <Box mb={4}>
                        <FeaturedObservations
                          handleObservationSelection={
                            (selectedObservations) => handleObservationSelection(coreId, selectedObservations)
                          }
                          selectableObservations={observations.filter((obs) => (
                            (!obs.core || obs.core?.id === coreId) &&
                            !featuredIds.includes(obs.id)
                          ))}
                          featuredObservations={featuredObservations}
                        />
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            ))}
            {mainTab === 'signatures' && (
              <Box mt={8}>
                <Signatures
                  signers={signers}
                  mainTeacher={mainTeacher}
                  coordinator={coordinator}
                  principal={principal}
                  currentUser={currentUser}
                />
              </Box>
            )}
          </Box>
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={saveChangesSuccess}
            onClose={handleSnackbarClose}
            autoHideDuration={5000}
          >
            <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
              Avance guardado con éxito
            </Alert>
          </Snackbar>
          <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={saveChangesError}
            onClose={handleSnackbarClose}
            autoHideDuration={5000}
          >
            <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
              Hubo un error al guardar el avance
            </Alert>
          </Snackbar>
        </Box>
      )}
    </>
  )
};