import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, Select, IconButton, MenuItem, OutlinedInput, Stack, Switch, TableContainer, Typography, Checkbox, ListItemText, useMediaQuery, CircularProgress, useTheme } from '@mui/material';
import { Add, Download, Remove } from '@mui/icons-material';
import { getClassroom } from 'db/class';
import { getPlannedActivitiesByClassroomAndDates, getPlannedActivity } from 'db/plannedActivity';
import moment from 'moment-timezone';
import Head from 'next/head';
import { isAuthorized } from 'services/Authorization';
import { MixpanelContext } from 'services/MixpanelContext';
import { UserContext } from 'src/context/UserContext';
import { useReactToPrint } from 'react-to-print';
import { capitalize } from 'lodash';
import { enumerateWorkDaysBetweenDates } from 'src/helpers/dates';
import UngaRatioImage from 'src/components/utils/UngaRatioImage';
import { arrayToListText } from 'src/helpers/arrays';
import _ from 'lodash';
import axios from 'axios';
import { saveAs } from 'file-saver';
import LessonPlanService from 'services/LessonPlanService';
import { getInstitution } from 'db/institution';
import { nameMapper } from 'src/helpers/parsers';
import ManagePlannedActivitiesButton from 'src/components/activity/ManagePlannedActivitiesButton';
import { serializeForNextProps } from 'src/helpers/businessLogic';

const INITIAL_HEADERS = [
  'Día',
  'Núcleos',
  'OA y OAT',
  'Indicadores',
  'OE',
  'Experiencias',
  'I. de evaluación',
  'Materiales',
  'P. de la familia',
  'Rol del adulto',
]

const BASE_FONT_SIZES = {
  20: 20,
  18: 18,
  16: 16,
  14: 14,
  12: 12,
  10: 10,
  8: 8,
  6: 6,
}

const UNIQUE_FONT_SIZES = {
  20: 20,
  18: 12,
  16: 12,
  14: 12,
  12: 12,
  10: 12,
  8: 12,
  6: 12,
}

export async function getServerSideProps(context) {
  const lessonPlanService = new LessonPlanService(context);
  const {
    startDate,
    endDate,
    classroomId,
    institutionId,
    fontSizeMultiplier,
    uniqueFontSize,
    headers,
    isPrinting,
    plannedActivityId,
  } = lessonPlanService.getParams();

  if (!isPrinting) {
    const [isAuthorizedValue, returnValue] = await isAuthorized(context);
    if (!isAuthorizedValue) return returnValue;
  }

  // Format dates to include full day range using ISO strings to preserve timezone
  const startOfWeek = moment(startDate).startOf('day').toISOString();
  const endOfWeek = moment(endDate).endOf('day').toISOString();

  const classroom = await getClassroom(classroomId);
  const institution = institutionId ? await getInstitution(institutionId) : null;

  const plannedActivities = plannedActivityId
    ? [await getPlannedActivity(plannedActivityId)]
    : await getPlannedActivitiesByClassroomAndDates(
      classroomId,
      startOfWeek,
      endOfWeek
    );

  return {
    props: serializeForNextProps({
      plannedActivities,
      startDate,
      endDate,
      classroom,
      institution,
      fontSizeMultiplier,
      uniqueFontSize,
      headers,
      classroomId,
      isPrinting,
      plannedActivityId: plannedActivityId || null,
    })
  }
}

export default function PrintableLessonPlanTable({
  plannedActivities: propsPlannedActivities,
  startDate,
  endDate,
  classroom: {
    name: classroomName, level: { name: levelName }, mainTeacher, studentCount, allTeachers, id: classroomId
  },
  isPrinting,
  institution: propsInstitution,
  fontSizeMultiplier: propsFontSizeMultiplier,
  uniqueFontSize: propsUniqueFontSizes,
  headers: propsHeaders,
  plannedActivityId,
}) {
  const { institution: contextInstitution } = useContext(UserContext);
  const { trackPrintLessonPlanView, trackPrintLessonPlan } = useContext(MixpanelContext);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(propsFontSizeMultiplier || 1);
  const [plannedActivitiesPerDay, setPlannedActivitiesPerDay] = useState({});
  const [daysToPrint, setDaysToPrint] = useState([]);
  const [uniqueFontSize, setUniqueFontsize] = useState(propsUniqueFontSizes || false);
  const [fontSizes, setFontSizes] = useState(BASE_FONT_SIZES);
  const [headers, setHeaders] = useState(propsHeaders || INITIAL_HEADERS);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const fixedButtonsRef = useRef();
  const tableContainerRef = useRef();
  const lessonPlanTitle = `${capitalize(moment(startDate).format('dddd DD [de] MMMM'))} ${daysToPrint.length > 1 ? ` al ${moment(endDate).format('dddd DD [de] MMMM')}` : ''}`;
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const institution = useMemo(() => propsInstitution || contextInstitution, [propsInstitution, contextInstitution]);
  const otherTeachersNames = useMemo(() =>
    arrayToListText(allTeachers
      .filter((teacher) => teacher.id !== mainTeacher?.id)
      .map((teacher) => `${teacher.firstName} ${teacher.lastName}`)
    ),
    [allTeachers, mainTeacher]
  );
  const theme = useTheme();

  useEffect(() => {
    distributeDataPerDay(propsPlannedActivities || [])
  }, [propsPlannedActivities])

  const distributeDataPerDay = (plannedActivities) => {
    const plannedActivitiesPerDay = {};
    const newWorkDays = enumerateWorkDaysBetweenDates(startDate, endDate, 'dddd DD');
    
    // Create a map of YYYY-MM-DD dates to workDay strings for easier lookup
    const dateToWorkDayMap = {};
    const dateMoment = moment(startDate).startOf('day');
    const endDateMoment = moment(endDate).startOf('day');
    
    while (dateMoment.isSameOrBefore(endDateMoment, 'day')) {
      const dayOfWeek = dateMoment.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        const dateStr = dateMoment.format('YYYY-MM-DD');
        const workDayStr = dateMoment.format('dddd DD');
        dateToWorkDayMap[dateStr] = workDayStr;
      }
      dateMoment.add(1, 'day');
    }
    
    // Initialize all workDays with empty arrays
    newWorkDays.forEach((workDay) => {
      plannedActivitiesPerDay[workDay] = [];
    });
    
    // Distribute activities by matching their dates
    plannedActivities?.forEach((pa) => {
      const plannedDateStr = moment(pa.plannedDate).startOf('day').format('YYYY-MM-DD');
      const workDay = dateToWorkDayMap[plannedDateStr];
      if (workDay && plannedActivitiesPerDay[workDay]) {
        plannedActivitiesPerDay[workDay].push(pa);
      }
    });
    
    setDaysToPrint(newWorkDays);
    setPlannedActivitiesPerDay(plannedActivitiesPerDay);
  }

  useEffect(() => {/* trackPrintLessonPlanView('table') */}, [])

  const increaseFontSize = () => {
    setFontSizeMultiplier((oldValue) => oldValue + 0.2);
  }

  const decreaseFontSize = () => {
    setFontSizeMultiplier((oldValue) => oldValue - 0.2);
  }

  const handleUniqueFontSize = ({ target: { checked } }) => {
    setUniqueFontsize(checked);
    if (checked) setFontSizes(UNIQUE_FONT_SIZES);
    else setFontSizes(BASE_FONT_SIZES);
  }

  const printDesktop = useReactToPrint({
    content: () => tableContainerRef.current,
    documentTitle: `${lessonPlanTitle} tabla.pdf`,
  });

  const printMobile = useReactToPrint({
    content: () => tableContainerRef.current,
    documentTitle: `${lessonPlanTitle} tabla.pdf`,
    print: async (printIframe) => {
      try {
        const document = printIframe.contentDocument;
        if (document) {
          const html = document.getElementsByTagName('html')[0];
          const emptyStyleElements = html.querySelectorAll('style:empty[id]');
          // Remove the empty style elements from the container
          emptyStyleElements.forEach(styleElement => {
            styleElement.parentNode.removeChild(styleElement);
          });
          const response = await fetch(`/api/print/html`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              html: html.outerHTML,
            }),
          })
          const blob = await response.blob();
          saveAs(blob, `${lessonPlanTitle} tabla.pdf`)
        }
      } finally {
        setDownloadLoading(false);
      }
    }
  });

  // const printMobile = async () => {
  //   setDownloadLoading(true);
  //   try {
  //     fetch(`/api/print/html`, {
  //       method: 'GET',
  //     })
  //       .then((response) => response.blob())
  //       .then((blob) => {
  //         saveAs(blob, `${lessonPlanTitle} tabla.pdf`)
  //       })
  //       .finally(() => setDownloadLoading(false));
  //   } catch {
  //     setDownloadLoading(false);
  //   }
  // }

  const handlePrint = async () => {
    // trackPrintLessonPlan('table');
    if (mdUp) {
      printDesktop();
    } else {
      setDownloadLoading(true);
      printMobile();
    }
  }

  return (
    <Box>
      <Head>
        <title>Planificación {classroomName} {moment(startDate).format('DD/MM')}</title>
      </Head>
      <>
        <Stack mb={4} display={isPrinting ? 'none' : 'flex'}>
          <Typography>Columnas seleccionadas</Typography>
          <Select
            fullWidth
            multiple
            size="small"
            id="select-headers"
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            input={<OutlinedInput id="select-multiple-chip" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, overflowX: 'scroll' }}>
                {selected.map((label) => (
                  <Chip key={label} label={label} color="info" />
                ))}
              </Box>
            )}
          >
            {INITIAL_HEADERS.map((label) => (
              <MenuItem key={label} value={label}>
                <Checkbox checked={headers.includes(label)} size="small" sx={{ py: 0.5, pl: 0, pr: 1 }} />
                <ListItemText primary={label} />
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Box ref={tableContainerRef} pb={{ xs: 16, sm: 8 }}>
          <style type="text/css">
            {`
            @page { size: letter landscape; margin: 0.5cm; }
            td {
              border-left: 1px black solid !important;
              border-bottom: 1px black solid !important;
              padding: 0.5rem;
              vertical-align: top;
            }
            th {
              border-left: 1px black solid !important;
              border-bottom: 1px black solid !important;
              padding: 0.5rem;
              font-size: ${fontSizes[8] * fontSizeMultiplier}px;
              vertical-align: center;
              font-size: ${fontSizes[12]};
              line-height: 0.9rem;
              background-color: ${theme.palette.primary.main};
              color: white;
            }
            table { 
              border-top: 1px black solid !important;
              border-right: 1px black solid !important;
              border-spacing: 0;
            }
            .text-td {
              font-size: ${fontSizes[8] * fontSizeMultiplier}px;
            }
            `}
          </style>
          <Stack alignItems="center">
            {institution.logo && (
              <UngaRatioImage priority image={institution.logo} baseHeight={fontSizes[20] * 3} />
            )}
            <Typography textAlign="center" fontSize={fontSizes[20]}>
              {institution.name}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Stack>
              <Typography textAlign="left" variant="body2" fontSize={fontSizes[14]}>
                Planificación {classroomName}
              </Typography>
              <Typography textAlign="left" fontSize={fontSizes[12]}>
                {classroomName !== levelName && `${levelName}, `} {studentCount > 0 && `${studentCount} niños y niñas`}
              </Typography>
            </Stack>
            <Stack maxWidth="40%">
              <Typography textAlign="right" variant="body2" fontSize={fontSizes[14]}>
                {lessonPlanTitle}
              </Typography>
              {mainTeacher && (
                <Typography textAlign="right" fontSize={fontSizes[12]}>
                  Educadora a cargo: {mainTeacher.firstName} {mainTeacher.lastName}
                </Typography>
              )}
              {otherTeachersNames && (
                <Typography textAlign="right" fontSize={fontSizes[12]}>Equipo: {otherTeachersNames}</Typography>
              )}
            </Stack>
          </Stack>
          <TableContainer sx={{ mt: 2 }}>
            <table size="small" padding="none">
              <thead>
                <tr>
                  {INITIAL_HEADERS.filter((header) => headers.includes(header)).map((label) => (
                    <th key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(plannedActivitiesPerDay).length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Typography>No hay actividades planificadas para este período</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Debug: propsPlannedActivities count: {propsPlannedActivities?.length || 0}
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  Object.entries(plannedActivitiesPerDay).map(([workDay, plannedActivities]) => {
                  const activitiesToShow = plannedActivities.filter(
                    (plannedActivity) => !plannedActivity.hide
                  ).map((plannedActivity) => plannedActivity.activity);
                  const totalCurricularObjectives = activitiesToShow.reduce((acc, activity) => acc + activity.cores.reduce((acc2, core) => {
                    if (!activity.curricularObjectives) return acc2;
                    return acc2 + activity.curricularObjectives.filter((curricularObjective) => {
                      const coreId = curricularObjective.coreId || curricularObjective.Cores?.id;
                      return coreId === core.id;
                    }).length;
                  }, 0), 0);
                  const activitiesWithoutCurricularObjectives = activitiesToShow.filter(
                    (activity) => !activity.curricularObjectives || activity.curricularObjectives.length === 0
                  );
                  const totalRowsForDay = totalCurricularObjectives + activitiesWithoutCurricularObjectives.length;
                  return (
                    <React.Fragment key={workDay}>
                      {activitiesToShow.map((activity, i) => {
                        const allActivityObjectives = [...activity.objectives, ...activity.subObjectives];
                        let curricularObjectivesByCore = {};
                        let objectivesByCoreTexts = {};
                        activity.cores.forEach((core) => {
                          if (!activity.curricularObjectives) {
                            curricularObjectivesByCore[core.name] = [];
                          } else {
                            curricularObjectivesByCore[core.name] = activity.curricularObjectives.filter(
                              (curricularObjective) => {
                                const coreId = curricularObjective.coreId || curricularObjective.Cores?.id;
                                return coreId === core.id;
                              }
                            );
                          }
                          objectivesByCoreTexts[core.name] = allActivityObjectives.filter(
                            (objective) => objective.core?.id === core.id
                          ).map((objective) => (
                            <Typography key={objective.id} mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                              {objective.name}
                            </Typography>
                          ));
                        });
                        const totalActivityCurricularObjectives = Object.values(curricularObjectivesByCore).reduce((acc, curricularObjectives) => acc + curricularObjectives.length, 0);
                        const OEwithCurricularObjectives = activity.consequentialCurricularObjectives.map((cco) => {
                          let text = '';
                          const { name } = cco;
                          text += name;
                          const curricularObjectivesNames = [
                            ...cco.transversalCurricularObjectives.map((id) =>
                              `OAT ${activity.curricularObjectives.find((curricularObjective) => curricularObjective.id === id)?.name.split('.')[0]}`
                            ),
                            ...cco.specificCurricularObjectives.map((id) =>
                              `OA ${activity.curricularObjectives.find((curricularObjective) => curricularObjective.id === id)?.name.split('.')[0]}`
                            ),
                          ];
                          text += ` (${curricularObjectivesNames.join(', ')})`;
                          return text;
                        }, {});
                        
                        // If activity has no curricular objectives, render a single row
                        if (totalActivityCurricularObjectives === 0) {
                          return (
                            <tr key={activity.id}>
                              {i === 0 && headers.includes('Día') && (
                                <td rowSpan={totalRowsForDay} className="text-td">
                                  {_.capitalize(workDay)}
                                </td>
                              )}
                              {headers.includes('Núcleos') && (
                                <td className="text-td">
                                  {activity.cores.map(core => core.name).join(', ') || '-'}
                                </td>
                              )}
                              {headers.includes('OA y OAT') && (
                                <td className="text-td">-</td>
                              )}
                              {headers.includes('Indicadores') && (
                                <td className="text-td">
                                  {allActivityObjectives.map((objective) => (
                                    <Typography key={objective.id} mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                      {objective.name}
                                    </Typography>
                                  ))}
                                </td>
                              )}
                              {headers.includes('OE') && (
                                <td className="text-td">
                                  {OEwithCurricularObjectives.join(', ') || '-'}
                                </td>
                              )}
                              {headers.includes('Experiencias') && (
                                <td>
                                  <>
                                    <Typography fontWeight="bold" mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                      {activity.name}
                                    </Typography>
                                    <Box
                                      fontSize={fontSizes[8] * fontSizeMultiplier}
                                      dangerouslySetInnerHTML={{ __html: activity.description }}
                                    />
                                  </>
                                </td>
                              )}
                              {headers.includes('I. de evaluación') && (
                                <td>
                                  <Typography mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                    Registro de observación
                                  </Typography>
                                  <Typography mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                    Escala de apreciación
                                  </Typography>
                                </td>
                              )}
                              {headers.includes('Materiales') && (
                                <td>
                                  <Stack>
                                    {activity.materials?.map((material) => (
                                      <Typography key={material.id} mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                        {material.quantity} {material.name}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </td>
                              )}
                              {headers.includes('P. de la familia') && (
                                <td>{activity.familyParticipation || '-'}</td>
                              )}
                              {headers.includes('Rol del adulto') && (
                                <td>{activity.adultRole || '-'}</td>
                              )}
                            </tr>
                          );
                        }
                        
                        return (
                          <React.Fragment key={activity.id}>
                            {Object.entries(curricularObjectivesByCore).map(([coreName, coreCurricularObjectives], j) => (
                              <React.Fragment key={coreName}>
                                {coreCurricularObjectives.map((curricularObjective, k) => {
                                  const hasRow = (
                                    (i === 0 && j === 0 && k === 0 && headers.includes('Día'))
                                    || (k === 0 && headers.includes('Núcleos'))
                                    || headers.includes('OA y OAT')
                                    || (k === 0 && headers.includes('Indicadores'))
                                    || (j === 0 && k === 0 && headers.includes('OE'))
                                    || (j === 0 && k === 0 && headers.includes('Experiencias'))
                                    || (j === 0 && k === 0 && headers.includes('I. de evaluación'))
                                    || (j === 0 && k === 0 && headers.includes('Materiales'))
                                    || (j === 0 && k === 0 && headers.includes('P. de la familia'))
                                    || (j === 0 && k === 0 && headers.includes('Rol del adulto'))
                                  );
                                //   if (!hasRow) return <tr
                                //   key={`${activity.id}.${curricularObjective.id}`}
                                // >a</tr>;

                                  return (
                                    <tr
                                      key={`${activity.id}.${curricularObjective.id}`}
                                    >
                                      {i === 0 && j === 0 && k === 0 && headers.includes('Día') && (
                                        <td rowSpan={totalRowsForDay} className="text-td">
                                          {_.capitalize(workDay)}
                                        </td>
                                      )}
                                      {k === 0 && headers.includes('Núcleos') && (
                                        <td rowSpan={coreCurricularObjectives.length} className="text-td">
                                          {coreName}
                                        </td>
                                      )}
                                      {headers.includes('OA y OAT') && (
                                        <td rowSpan={1} className="text-td">
                                          {curricularObjective.name}
                                        </td>
                                      )}
                                      {k === 0 && headers.includes('Indicadores') && (
                                        <td rowSpan={coreCurricularObjectives.length} className="text-td">
                                          {objectivesByCoreTexts[coreName]}
                                        </td>
                                      )}
                                      {j === 0 && k === 0 && headers.includes('OE') && (
                                        <td rowSpan={totalActivityCurricularObjectives} className="text-td">
                                          {OEwithCurricularObjectives.join(', ')}
                                        </td>
                                      )}
                                      {j === 0 && k === 0 && (
                                        <>
                                          {headers.includes('Experiencias') && (
                                            <td rowSpan={totalActivityCurricularObjectives}>
                                              <>
                                                <Typography fontWeight="bold" mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                                  {activity.name}
                                                </Typography>
                                                <Box
                                                  fontSize={fontSizes[8] * fontSizeMultiplier}
                                                  dangerouslySetInnerHTML={{ __html: activity.description }}
                                                />
                                              </>
                                            </td>
                                          )}
                                          {headers.includes('I. de evaluación') && (
                                            <td rowSpan={totalActivityCurricularObjectives}>
                                              <Typography mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                                Registro de observación
                                              </Typography>
                                              <Typography mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                                Escala de apreciación
                                              </Typography>
                                            </td>
                                          )}
                                          {headers.includes('Materiales') && (
                                            <td rowSpan={totalActivityCurricularObjectives}>
                                              <Stack>
                                                {activity.materials.map((material) => (
                                                  <Typography key={material.id} mb={0.5} fontSize={fontSizes[8] * fontSizeMultiplier}>
                                                    {material.quantity} {material.name}
                                                  </Typography>
                                                ))}
                                              </Stack>
                                            </td>
                                          )}
                                          {headers.includes('P. de la familia') && (
                                            <td rowSpan={totalActivityCurricularObjectives}>
                                              {activity.familyParticipation}
                                            </td>
                                          )}
                                          {headers.includes('Rol del adulto') && (
                                            <td rowSpan={totalActivityCurricularObjectives}>
                                              {activity.adultRole}
                                            </td>
                                          )}
                                        </>
                                      )}
                                    </tr>
                                  )
                                })}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        )
                      })
                      }
                    </React.Fragment>
                  )
                })
                )}
              </tbody>
            </table>
          </TableContainer>
        </Box>
        <Stack
          ref={fixedButtonsRef}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 2 }}
          sx={{ position: 'fixed', bottom: 10, left: { xs: 10, sm: 'inherit' }, right: 10 }}
          display={isPrinting ? 'none' : 'flex'}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            pl={1}
            sx={{
              borderRadius: '4px',
              border: '1px solid rgba(228, 155, 112, 0.5)',
              backgroundColor: 'background.default'
            }}
          >
            <Typography
              variant="button"
              fontSize="0.875rem"
              fontWeight={500}
              sx={{ color: 'primary.main' }}
            >
              Homologar tamaño de letra
            </Typography>
            <Switch checked={uniqueFontSize} onChange={handleUniqueFontSize} />
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{
              borderRadius: '4px',
              border: '1px solid rgba(228, 155, 112, 0.5)',
              backgroundColor: 'background.default'
            }}
          >
            <IconButton
              onClick={decreaseFontSize}
              color="primary"
            >
              <Remove fontSize="small" />
            </IconButton>
            <Typography fontSize="0.875rem" fontWeight={500} sx={{ color: 'primary.main' }}>Tamaño de letra</Typography>
            <IconButton
              onClick={increaseFontSize}
              color="primary"
            >
              <Add fontSize="small" />
            </IconButton>
          </Stack>
          <ManagePlannedActivitiesButton
            plannedActivitiesPerDay={plannedActivitiesPerDay}
            onChange={setPlannedActivitiesPerDay}
            color="info"
          />
          <Button
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            variant="contained"
            onClick={handlePrint}
          >
            Imprimir o descargar planificación
          </Button>
          <Button
            sx={(theme) => ({
              display: { xs: 'inline-flex', sm: 'none' },
              backgroundColor: downloadLoading ? theme.palette.grey[400] : theme.palette.primary.main,
            })}
            variant="contained"
            onClick={downloadLoading ? () => { } : handlePrint}
            startIcon={!downloadLoading && <Download />}
            endIcon={downloadLoading && <CircularProgress color="info" size={16} />}
          >
            {downloadLoading ? 'Estamos generando el PDF' : 'Descargar'}
          </Button>
        </Stack>
      </>
    </Box >
  )
}