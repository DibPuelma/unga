import React, { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  useMediaQuery,
} from '@mui/material';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

import { MenuBook, AutoGraph, VisibilityOutlined, EventAvailable } from '@mui/icons-material';

import ExpandableCoresList from 'src/components/cores/ExpandableCoresList';
import StudentObservations from 'src/components/observations/StudentObservations';
import { a11yTabProps } from 'src/helpers/a11y';
import Link from 'src/Link';
import { getCoresWithLevelsOfAchievementByStudent } from 'db/core';
import { getStudent } from 'db/student';
import { getObservationsByStudent } from 'db/observation';
import { MixpanelContext } from 'services/MixpanelContext';
import Binnacle from 'src/components/students/Binnacle';
import { isAuthorized } from 'services/Authorization';
import { getInstitution } from 'db/institution';
import Head from 'next/head';
import AttendanceShowcase from 'src/components/attendance/AttendanceShowcase';
import moment from 'moment-timezone';
import GenerateReportButton from 'src/components/report/GenerateButton';
import PlansService from 'services/PlansService';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.plansFromIndividualGrow);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);

  const { params: { studentId } } = context;
  const { user: { institution: { id: institutionId } } } = session;

  const student = await getStudent(studentId);
  const cores = await getCoresWithLevelsOfAchievementByStudent({
    institutionId,
    studentId,
    startDate: moment().startOf('year').format('YYYY-MM-DD'),
    endDate: moment().add(1, 'day').format('YYYY-MM-DD'),
  });
  const observations = await getObservationsByStudent(studentId)
  const institution = await getInstitution(institutionId);

  return {
    props: serializeForNextProps({
      cores: cores.filter((core) => !core.hide),
      student,
      observations,
      institution,
    }),
  };
}

export default function Student({ cores, student, observations, institution }) {
  const { asPath, query: { classroomId, studentId } } = useRouter();
  const { trackGenerateReport, trackStudentPageView } = useContext(MixpanelContext);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    // trackStudentPageView(student.fullName, student.class.name);
  }, []);

  const handleTabChange = (_, newValue) => setTab(newValue);

  const smUp = useMediaQuery(theme => theme.breakpoints.up('sm'))

  return (
    <Box pb={8}>
      <Head><title>{student.fullName}</title></Head>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="tabs para avance y observaciones"
          variant="scrollable"
        >
          {institution.qualitativeOnly ? ([
            <Tab
              key="Observaciones"
              label="Observaciones"
              {...a11yTabProps(0)}
              icon={<VisibilityOutlined />}
              iconPosition={smUp ? 'start' : 'top'}
            />,
            <Tab
              key="Asistencia"
              label="Asistencia"
              {...a11yTabProps(1)}
              icon={<EventAvailable />}
              iconPosition={smUp ? 'start' : 'top'}
            />,
            institution.features?.binnacle &&
            <Tab
              key="Bitácora"
              label="Bitácora"
              {...a11yTabProps(2)}
              icon={<MenuBook />}
              iconPosition={smUp ? 'start' : 'top'}
            />,
          ]
          ) :
            ([
              <Tab
                key="Avance"
                label="Avance"
                {...a11yTabProps(0)}
                icon={<AutoGraph />}
                iconPosition={smUp ? 'start' : 'top'}
              />,
              <Tab
                key="Observaciones"
                label="Observaciones"
                {...a11yTabProps(1)}
                icon={<VisibilityOutlined />}
                iconPosition={smUp ? 'start' : 'top'}
              />,
              <Tab
                key="Asistencia"
                label="Asistencia"
                {...a11yTabProps(2)}
                icon={<EventAvailable />}
                iconPosition={smUp ? 'start' : 'top'}
              />,
              institution.features?.binnacle &&
              <Tab
                key="Bitácora"
                label="Bitácora"
                {...a11yTabProps(3)}
                icon={<MenuBook />}
                iconPosition={smUp ? 'start' : 'top'}
              />,
            ])}
        </Tabs>
        {cores.length > 0 && (
          <Stack
            spacing={1}
            direction="row"
            justifyContent="flex-end"
            sx={{
              position: { xs: 'fixed', md: 'inherit' },
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: { xs: 'white', md: 'transparent' },
              p: 1,
            }}
          >
            <Link
              noLinkStyle
              href={`/students/${studentId}/reports`}
              sx={{ display: { xs: 'none', sm: 'inherit' } }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {/* trackGenerateReport(student.fullName, student.class.name) */}}
              >
                Ver informes anteriores
              </Button>
            </Link>
              <GenerateReportButton classroomId={classroomId} studentId={studentId} />
          </Stack>
        )}
      </Stack>
      {tab === 0 && !institution.qualitativeOnly && (
        <Box mt={2}>
          <ExpandableCoresList
            cores={cores}
            student={student}
          />
        </Box>
      )}
      {(tab === 1 || (institution.qualitativeOnly && tab === 0)) && (
        <Box py={{ xs: 2, md: 4 }}>
          <StudentObservations student={student} observations={observations} />
        </Box>
      )}
      {(tab === 2 || (institution.qualitativeOnly && tab === 1)) && (
        <Box py={{ xs: 2, md: 4 }}>
          <AttendanceShowcase
            classroomId={classroomId}
            studentId={student.id}
          />
        </Box>
      )}
      {(tab === 3 || (institution.qualitativeOnly && tab === 2) && institution.features?.includes('binnacle')) && (
        <Box py={{ xs: 2, md: 4 }}>
          <Binnacle observations={observations} />
        </Box>
      )}
    </Box>
  )
};