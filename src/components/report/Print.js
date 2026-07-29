import React, { useEffect, useState } from 'react';
import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { LocationOn, Language, Mail, Phone, PhoneIphone, AccountBalance, ChildCare, SchoolOutlined, Today, Star, CakeOutlined, GroupsOutlined } from '@mui/icons-material';
import moment from 'moment';

import CoresList from 'src/components/cores/CoresList';
import CoreReportDetail from 'src/components/cores/CoreReportDetail';
import LevelsOfAchievementDescription from 'src/components/levelsOfAchievement/DescriptionsForReport';
import UngaRatioImage from 'src/components/utils/UngaRatioImage';
import ObservationsList from 'src/components/observations/ObservationsList';
import PageHeader from 'src/components/report/PageHeader';
import StudentAttendanceHeatMap from '../attendance/StudentAttendanceHeatMap';
import Signatures from '../utils/Signatures';

export default function PrintReport({
  student,
  institution,
  signers,
  mainTeacher,
  coresWithAdvancement,
  coresByScopes,
  descriptionByScope,
  timePeriods,
  summaryText,
  observationsByCore,
  currentUser,
  principal,
  coordinator,
  level,
  attendanceByDate,
  onFinishRender,
  classroomReportConfiguration,
  reportDate,
}) {
  const [attendanceFinishedRendering, setAttendanceFinishedRendering] = useState(false);
  const backgroundGray = '#f5f5f5';

  useEffect(() => {
    if (!classroomReportConfiguration.showAttendance) {
      setAttendanceFinishedRendering(true);
      return;
    }
    // Chart.js's animation.onComplete doesn't always fire (notably with animation
    // duration 0), which would leave the download stuck waiting forever.
    const fallbackTimeout = setTimeout(() => setAttendanceFinishedRendering(true), 3000);
    return () => clearTimeout(fallbackTimeout);
  }, [])

  useEffect(() => {
    if (attendanceFinishedRendering) onFinishRender();
  }, [attendanceFinishedRendering])

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
        <Stack direction="row" alignItems="center" spacing={1}>
          <CakeOutlined color="primary" fontSize="small" />
          <Typography>
            {normalizedBirthDate.format('DD [de] MMMM [de] YYYY')}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ChildCare color="primary" fontSize="small" />
          <Typography>
            {years} {yearsText} {months} {monthsText}
          </Typography>
        </Stack>
      </>
    )
  }

  return (
    <Box>
      <Stack rowGap={4}>
        <Grid container alignItems="center" id="report-print-header">
          <Grid item xs={12}>
            <PageHeader />
          </Grid>
        </Grid>
        <Stack direction="row" justifyContent="center" alignItems="center" px={6} my={4} columnGap={8}>
          {institution.logo && (
            <UngaRatioImage
              alt="Institution logo"
              component="img"
              image={institution.logo}
              baseHeight={120}
              borderRadius={5}
            />
          )}
          <Stack>
            <Typography variant="h4" textAlign="center" fontWeight="bold">{student.firstName} {student.lastName}</Typography>
            <Typography variant="h6" textAlign="center" fontWeight="bold">Informe de evaluación</Typography>
            <Typography textAlign="center">{level}</Typography>
          </Stack>
          {student.profilePicture && (
            <UngaRatioImage
              alt="Student profile"
              component="img"
              image={student.profilePicture}
              baseHeight={120}
              borderRadius={5}
            />
          )}
        </Stack>
        <Grid container px={6} columns={11} mb={4}>
          <Grid item xs={5} display="flex" justifyContent="flex-end">
            <Stack>
              <Typography variant="h5" mb={1.5} fontWeight="bold">
                {institution.name}
              </Typography>
              {institution.code && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccountBalance color="primary" sx={{ fontSize: 14 }} />
                  <Typography fontSize={14}>
                    R.B.D {institution.code}
                  </Typography>
                </Stack>

              )}
              {institution.address && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOn color="primary" sx={{ fontSize: 14 }} />
                  <Typography fontSize={14}>
                    {institution.address}
                  </Typography>
                </Stack>
              )}
              {institution.email && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Mail color="primary" sx={{ fontSize: 14 }} />
                  <Typography fontSize={14}>
                    {institution.email}
                  </Typography>
                </Stack>
              )}
              {institution.mobilePhone && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PhoneIphone color="primary" sx={{ fontSize: 14 }} />
                  <Typography fontSize={14}>
                    {institution.mobilePhone}
                  </Typography>
                </Stack>
              )}
              {institution.phone && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Phone color="primary" sx={{ fontSize: 14 }} />
                  <Typography fontSize={14}>
                    {institution.phone}
                  </Typography>
                </Stack>
              )}
              {institution.webpage && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Language color="primary" sx={{ fontSize: 14 }} />
                  <Typography fontSize={14}>
                    {institution.webpage}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Grid>
          <Grid item xs={1} display="flex" justifyContent="center">
            <Divider
              orientation="vertical"
              sx={(theme) => ({
                borderColor: theme.palette.primary.main,
                borderStyle: 'dashed',
                borderWidth: 1,
              })}
            />
          </Grid>
          <Grid item xs={5}>
            <Stack spacing={0.5}>
              <Typography variant="h5" mb={1.5} fontWeight="bold">
                Información general
              </Typography>
              {getBirthAndAge()}
              {mainTeacher && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SchoolOutlined color="primary" fontSize="small" />
                  <Typography>
                    {mainTeacher.firstName} {mainTeacher.lastName}
                  </Typography>
                </Stack>
              )}
              {classroomReportConfiguration.showTeam && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupsOutlined color="primary" fontSize="small" />
                  <Typography>
                    {classroomReportConfiguration.team}
                  </Typography>
                </Stack>
              )}
              {!classroomReportConfiguration.hideDate && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Today color="primary" fontSize="small" />
                  <Typography>
                    {reportDate.format("DD [de] MMMM [de] YYYY")}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
        <Box px={6} display={classroomReportConfiguration.showAttendance ? 'block' : 'none'}>
          <Stack alignItems="center">
            <Typography variant="h5" mb={1.5} fontWeight="bold">
              Asistencia
            </Typography>
            <StudentAttendanceHeatMap
              attendanceAnalyticsByDate={attendanceByDate}
              onFinishRender={() => setAttendanceFinishedRendering(true)}
            />
          </Stack>
        </Box>
        <Box px={6} py={2} sx={{ backgroundColor: backgroundGray }}>
          <Typography variant="h5" mb={2} fontWeight="bold" textAlign="center">Descripción de los niveles de logro</Typography>
          <LevelsOfAchievementDescription />
        </Box>
      </Stack>
      <Stack sx={{ breakBefore: 'page' }}>
        <Stack direction="row" alignItems="center" spacing={4} px={6} mt="1cm">
          <Typography variant="h5">
            <b>Resumen del avance de {student.firstName}</b>
          </Typography>
          <Box height="1px" sx={{ backgroundColor: '#5d5d5d' }} flex={1} />
        </Stack>
        <Grid container mt={2}>
          {!institution.qualitativeOnly && (
            <Grid item xs={12}>
              <Box mb={8} px={6}>
                <CoresList cores={coresWithAdvancement} report />
              </Box>
            </Grid>
          )}
          <Grid item xs={12} sx={{ backgroundColor: backgroundGray }} pr={2} py={2}>
            <Stack spacing={2} px={6} sx={{ breakInside: 'avoid' }} mt={2}>
              <Typography variant="h5" textAlign="center">
                <b>Comentarios generales</b>
              </Typography>
              <Typography textAlign="justify" whiteSpace="pre-line">
                {summaryText}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <Box sx={{ breakBefore: 'page' }}>
        {Object.entries(coresByScopes).filter(
          ([_, cores]) => cores.reduce((acc, core) => acc || Object.values(core.objectives).reduce((acc, objectives) => acc || objectives.length > 0, false), false)
        ).map(([scope, cores], i) => (
          <Box key={scope} mt="1cm" sx={i < Object.keys(coresByScopes).length - 1 ? { breakAfter: 'page' } : {}}>
            <Typography variant="h4" mb={4} textAlign="center"><b>{scope}</b></Typography>
            {descriptionByScope[scope] && (
              <Stack sx={{ backgroundColor: backgroundGray }} direction="row" alignItems="flex-start" px={6} py={2} spacing={4} mb={6}>
                <Typography variant="h6" flex={1} lineHeight={1.3}><b>Comentarios</b></Typography>
                <Typography flex={3} textAlign="justify" whiteSpace="pre-line">{descriptionByScope[scope]}</Typography>
              </Stack>
            )}
            <Box my={4}>
              {cores.map((core, j) => (
                <Box key={core.name} mt={8}>
                  <Box px={6} mb={4}>
                    <CoreReportDetail
                      qualitativeOnly={institution.qualitativeOnly}
                      core={core}
                      student={student}
                      timePeriods={timePeriods}
                    />
                  </Box>
                  {observationsByCore[core.id] &&
                    observationsByCore[core.id].length > 0 && (
                      <Stack direction="row" alignItems="center" px={6} py={1} spacing={2} sx={{ backgroundColor: backgroundGray, breakInside: 'avoid' }}>
                        <Star color="info" />
                        <Stack direction="row" alignItems="center" spacing={4}>
                          <Typography variant="subtitle2">Observaciones destacadas</Typography>
                          <ObservationsList
                            observations={observationsByCore[core.id]}
                            columns={1}
                            noSearch
                            report
                          />
                        </Stack>
                      </Stack>
                    )}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
      <Box px={6} mt={4} sx={{ breakInside: 'avoid' }}>
        <Signatures
          signers={signers}
          mainTeacher={mainTeacher}
          coordinator={coordinator}
          principal={principal}
          currentUser={currentUser}
        />
      </Box>
    </Box >
  )
};