import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { getClassroom } from 'db/class';
import { getInstitution } from 'db/institution';
import { getPlannedActivitiesByClassroomAndDates } from 'db/plannedActivity';
import moment from 'moment-timezone';
import Head from 'next/head';
import Image from 'next/image';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isAuthorized } from 'services/Authorization';
import { MixpanelContext } from 'services/MixpanelContext';
import PlannedActivityCard from 'src/components/activity/PlannedActivityCard';
import UngaRatioImage from 'src/components/utils/UngaRatioImage';
import { UserContext } from 'src/context/UserContext';
import ManagePlannedActivitiesButton from 'src/components/activity/ManagePlannedActivitiesButton';
import { serializeForNextProps } from 'src/helpers/businessLogic';


export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { params: { classroomId }, query: { startDate, endDate } } = context;
  const startOfWeek = moment(startDate).startOf('day').format('YYYY-MM-DD');
  const endOfWeek = moment(endDate).endOf('day').format('YYYY-MM-DD');
  const {
    user: {
      institution: { id: institutionId },
    },
  } = session;

  const plannedActivities = await getPlannedActivitiesByClassroomAndDates(
    classroomId,
    startOfWeek,
    endOfWeek
  );

  const institution = await getInstitution(institutionId);
  const classroom = await getClassroom(classroomId);

  return {
    props: serializeForNextProps({
      plannedActivities,
      institution,
      classroom,
      startDate,
    })
  }
}

export default function PrintableLessonPlanCalendar({
  plannedActivities: propsPlannedActivities,
  institution,
  classroom,
  startDate,
}) {
  const { trackPrintLessonPlanView, trackPrintLessonPlan } = useContext(MixpanelContext);
  const [plannedActivitiesPerDay, setPlannedActivitiesPerDay] = useState({});
  const fixedButtonsRef = useRef();
  const calendarContainerStackRef = useRef();

  useEffect(() => {
    distributeActivitiesPerDay(propsPlannedActivities)
  }, [propsPlannedActivities])

  const distributeActivitiesPerDay = (plannedActivities) => {
    const newPlannedActivitiesPerDay = {};
    moment.weekdays().slice(1, -1).forEach((workDay) => {
      newPlannedActivitiesPerDay[workDay] = plannedActivities.filter(
        (pa) => workDay === moment.utc(pa.plannedDate).format('dddd')
      );
    })
    setPlannedActivitiesPerDay(newPlannedActivitiesPerDay);
  }

  useEffect(() => {/* trackPrintLessonPlanView('calendar') */}, [])

  const handlePrint = () => {
    fixedButtonsRef.current.style.display = 'none';
    const header = document.getElementsByTagName("header")[0];
    header.style.display = 'none';
    calendarContainerStackRef.current.style.marginTop = '-50px';
    const css = `@page { size: letter landscape; marginTop: 3cm; marginBottom: 3cm; }`;
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');

    style.type = 'text/css';
    style.media = 'print';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    // trackPrintLessonPlan('calendar');

    head.appendChild(style);
    window.print();

    fixedButtonsRef.current.style.display = 'flex';
    header.style.display = 'flex';
    calendarContainerStackRef.current.style.marginTop = 0;
    head.removeChild(style);
  }

  return (
    <Box>
      <Head>
        <title>Calendario de actividades</title>
      </Head>
      <Box minHeight={600} ref={calendarContainerStackRef} pb={10}>
        <Stack direction="row" alignItems="center" spacing={2} justifyContent="center" mb={3}>
          {institution.logo && (
            <UngaRatioImage image={institution.logo} baseHeight={45} />
          )}
          <Stack>
            <Typography variant="h6">Calendario de actividades de {moment(startDate).format('MMMM')}</Typography>
            <Typography>{classroom.name}</Typography>
            {classroom.name !== classroom.level.name && (
              <Typography variant="body2">{classroom.level.name}</Typography>
            )}
          </Stack>
        </Stack>
        <Stack
          mt={2}
          justifyContent="space-between"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          minHeight="60vh"
        >
          {Object.entries(plannedActivitiesPerDay).map(([workDay, plannedActivities], i) => {
            const plannedActivitiesToShow = plannedActivities.filter((plannedActivity) => !plannedActivity.hide);
            const componentDate = moment(startDate).add(i, 'days');
            return (
              <Stack
                key={workDay}
                flex={1}
                minWidth="19%"
              >
                <Typography
                  variant="subtitle1"
                  textAlign="center"
                >
                  {workDay.charAt(0).toLocaleUpperCase()}{workDay.substring(1, workDay.length)} {componentDate.format('DD')}
                </Typography>
                <Stack
                  border={1}
                  borderRadius={3}
                  borderColor={(theme) => theme.palette.grey[500]}
                  p={1}
                  flex={1}
                >
                  {plannedActivitiesToShow.map((plannedActivity, i) => (
                    <>
                      <PlannedActivityCard
                        printable
                        key={plannedActivity.id}
                        plannedActivity={plannedActivity}
                      />
                      <Divider sx={{ my: 0.5 }} />
                    </>
                  ))}
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      </Box>
      <Stack
        ref={fixedButtonsRef}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 0.5, sm: 2 }}
        sx={{ position: 'fixed', bottom: 10, left: { xs: 10, sm: 'inherit' }, right: 10 }}
      >
        <ManagePlannedActivitiesButton
          plannedActivitiesPerDay={plannedActivitiesPerDay}
          onChange={setPlannedActivitiesPerDay}
          color="info"
        />

        <Button
          variant="contained"
          onClick={handlePrint}
        >
          Imprimir o descargar calendario
        </Button>
      </Stack>
    </Box>
  )
}