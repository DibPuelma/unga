import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowBack, ArrowForward, AutoFixHighOutlined, ContentCopy, ExpandMore, LockOutlined } from '@mui/icons-material';
import { Alert, Box, Button, IconButton, Menu, MenuItem, Snackbar, Stack, Typography, useTheme } from '@mui/material';
import axios from 'axios';
import { getClassroom } from 'db/class';
import { getPlannedActivitiesByClassroomAndDates } from 'db/plannedActivity';
import moment from 'moment-timezone';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import Head from 'next/head';
import Link from 'src/Link';
import { isAuthorized } from 'services/Authorization';
import { MixpanelContext } from 'services/MixpanelContext';
import { UserContext } from 'src/context/UserContext';
import { getInstitutionWithStructure } from 'db/institution';
import { getInstitutionCalendarEvents } from 'db/institutionCalendarEvent';
import { getEditAccessClassrooms } from 'src/helpers/businessLogic';
import { LoadingButton } from '@mui/lab';
import UngaCircularProgress from 'src/components/utils/UngaCircularProgress';
import UngaError from 'src/components/utils/UngaError';
import { useRouter } from 'next/router';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import UngaJoyride from 'src/components/utils/UngaJoyride';
import { STATUS } from 'react-joyride';
import UngaFullScreenDialog from 'src/components/utils/UngaFullScreenDialog';
import SuggestedWeeklyCalendar from 'src/components/activity/SuggestedWeeklyCalendar';
import WeeklyActivitiesCalendar from 'src/components/activity/WeeklyActivitiesCalendar';
import { IS_WEEKEND, START_OF_CURRENT_WEEK, END_OF_CURRENT_WEEK } from 'src/helpers/dates';
import PlansService from 'services/PlansService';
import usePlans from 'src/hooks/usePlans';
import usePlanUpgradeWarning from 'src/hooks/usePlanUpgradeWarning';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.PLANS_WITH_PLANNING);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);
  const { user, user: { institution: { id: institutionId } } } = session;
  const { params: { classroomId }, query: { startDate } } = context;

  let startOfCurrentWeek = START_OF_CURRENT_WEEK;
  let endOfCurrentWeek = END_OF_CURRENT_WEEK;
  if (startDate) {
    startOfCurrentWeek = moment(startDate).startOf('week').format('YYYY-MM-DD');
    endOfCurrentWeek = moment(startDate).endOf('week').subtract(2, 'days').format('YYYY-MM-DD');
  }
  const classroom = await getClassroom(classroomId);

  const plannedActivities = await getPlannedActivitiesByClassroomAndDates(
    classroomId,
    startOfCurrentWeek,
    endOfCurrentWeek
  );

  const institution = await getInstitutionWithStructure(institutionId);

  const calendarEvents = await getInstitutionCalendarEvents(
    institutionId,
    startOfCurrentWeek,
    endOfCurrentWeek
  );

  return {
    props: serializeForNextProps({
      user,
      institution,
      plannedActivities,
      classroom,
      startOfCurrentWeek,
      endOfCurrentWeek,
      calendarEvents,
    })
  }
}

export default function LessonPlan({
  user,
  institution,
  plannedActivities,
  classroom,
  startOfCurrentWeek,
  endOfCurrentWeek,
  calendarEvents,
}) {
  const indexBaseUrl = `/institutions/${institution.id}/activities`;
  const router = useRouter();
  const { query: { onboardingType } } = router;
  const { setSelectedClassroom, finishTour, institution: { features }, user: { plan } } = useContext(UserContext);
  const { trackLessonPlanPageView, trackCopyLessonPlan, trackOnboardingStep } = useContext(MixpanelContext);
  const [selectedStartOfWeek, setSelectedStartOfWeek] = useState(startOfCurrentWeek);
  const [selectedEndOfWeek, setSelectedEndOfWeek] = useState(endOfCurrentWeek)
  const [plannedActivitiesByDay, setPlannedActivitiesByDay] = useState({});
  const [plannedActivitiesPreparation, setPlannedActivitiesPreparation] = useState({
    loading: false,
    error: false,
  })
  const [printMenuAnchorEl, setPrintMenuAnchorEl] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copyQuery, setCopyQuery] = useState({});
  const [selectedPlannedActivities, setSelectedPlannedActivities] = useState([]);
  const [copyMenuAnchorEl, setCopyMenuAnchorEl] = useState(null);
  const [dragWarning, setDragWarning] = useState(false);
  const [openSuggestWeekDialog, setOpenSuggestWeekDialog] = useState(false);
  const [dynamicPlannedActivities, setDynamicPlannedActivities] = useState(plannedActivities);
  const [dynamicCalendarEvents, setDynamicCalendarEvents] = useState(calendarEvents);

  const classroomId = useMemo(() => classroom.id, [classroom]);
  const editAccessClassrooms = getEditAccessClassrooms(user, institution.classrooms)
    .filter((classroom) => classroom.id !== classroomId);

  const handleOpenPrintMenu = (event) => {
    setPrintMenuAnchorEl(event.currentTarget);
  };

  const handleClosePrintMenu = () => {
    setPrintMenuAnchorEl(null);
  };

  const handleOpenCopyMenu = (event) => {
    setCopyMenuAnchorEl(event.currentTarget);
  };

  const handleCloseCopyMenu = () => {
    setCopyMenuAnchorEl(null);
  };

  useEffect(() => {
    setSelectedClassroom(classroom);
    setDynamicPlannedActivities(plannedActivities);
    setDynamicCalendarEvents(calendarEvents);
    setSelectedStartOfWeek(startOfCurrentWeek);
    setSelectedEndOfWeek(endOfCurrentWeek);
  }, [classroom, plannedActivities, calendarEvents, startOfCurrentWeek, endOfCurrentWeek])

  useEffect(() => {
    // trackLessonPlanPageView(classroom.name)
  }, [])

  useEffect(() => {
    distributeActivitiesByDay(dynamicPlannedActivities)
  }, [dynamicPlannedActivities])

  const distributeActivitiesByDay = (plannedActivities) => {
    const newPlannedActivitiesByDay = {};
    // Create a map of date strings (YYYY-MM-DD) to workDay numbers
    const dateToWorkDayMap = {};
    const weekStartMoment = moment(selectedStartOfWeek).startOf('day');
    [1, 2, 3, 4, 5].forEach((workDay) => {
      const dateForWorkDay = weekStartMoment.clone().add(workDay - 1, 'days');
      const dateStr = dateForWorkDay.format('YYYY-MM-DD');
      dateToWorkDayMap[dateStr] = workDay;
      newPlannedActivitiesByDay[workDay] = [];
    });
    
    // Distribute activities by matching their dates
    // Parse dates as UTC to match how they're stored (UTC midnight for the date)
    plannedActivities.forEach((pa) => {
      const plannedDateStr = moment.utc(pa.plannedDate).format('YYYY-MM-DD');
      const workDay = dateToWorkDayMap[plannedDateStr];
      if (workDay) {
        newPlannedActivitiesByDay[workDay].push(pa);
      }
    });
    
    // Sort activities by position within each day
    [1, 2, 3, 4, 5].forEach((workDay) => {
      newPlannedActivitiesByDay[workDay].sort((a, b) => a.position - b.position);
    });
    
    setPlannedActivitiesByDay(newPlannedActivitiesByDay);
  }

  const getPlannedActivities = async (startDate, endDate) => {
    setPlannedActivitiesPreparation({ loading: true });
    const formattedStartDate = startDate;
    const formattedEndDate = endDate;
    const baseUrl = `/api/classrooms/${classroomId}/planned-activities`;
    const queryParams = `?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
    try {
      const response = await axios.get(`${baseUrl}${queryParams}`);
      setDynamicPlannedActivities(response.data);
      distributeActivitiesByDay(response.data);
      
      // Fetch calendar events for the new date range
      const calendarEventsUrl = `/api/institutions/${institution.id}/calendar-events?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      const calendarEventsResponse = await axios.get(calendarEventsUrl);
      setDynamicCalendarEvents(calendarEventsResponse.data);
    } catch (error) {
      setPlannedActivitiesPreparation({ error: true })
      setPlannedActivitiesByDay({});
      console.error(error)
    } finally {
      setPlannedActivitiesPreparation((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const goToCurrentWeek = () => {
    const startOfNowWeek = moment().startOf('week').format('YYYY-MM-DD');
    const endOfNowWeek = moment().endOf('week').subtract(2, 'days').format('YYYY-MM-DD');
    if (selectedStartOfWeek === startOfNowWeek) return;
    setSelectedStartOfWeek(startOfNowWeek);
    setSelectedEndOfWeek(endOfNowWeek);
    getPlannedActivities(startOfNowWeek, endOfNowWeek);
  }

  const handleWeekBack = () => {
    const newStartOfWeek = moment(selectedStartOfWeek).subtract(7, 'days').format('YYYY-MM-DD')
    const newEndOfWeek = moment(selectedEndOfWeek).subtract(7, 'days').format('YYYY-MM-DD')
    setSelectedStartOfWeek(newStartOfWeek);
    setSelectedEndOfWeek(newEndOfWeek);
    getPlannedActivities(newStartOfWeek, newEndOfWeek);
  }

  const handleWeekForward = () => {
    const newStartOfWeek = moment(selectedStartOfWeek).add(7, 'days').format('YYYY-MM-DD')
    const newEndOfWeek = moment(selectedEndOfWeek).add(7, 'days').format('YYYY-MM-DD')
    setSelectedStartOfWeek(newStartOfWeek);
    setSelectedEndOfWeek(newEndOfWeek);
    getPlannedActivities(newStartOfWeek, newEndOfWeek);
  }

  const getDroppableDate = (workDay) => {
    return moment(selectedStartOfWeek).add(workDay - 1, 'days');
  }

  const isBeforeNow = (droppable) => {
    const date = getDroppableDate(droppable.droppableId);
    if (date.isBefore(moment(), 'day')) return true;

    return false;
  }

  const onDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceWorkDay = source.droppableId;
    if (destination.droppableId !== source.droppableId) {
      if (isBeforeNow(source) || isBeforeNow(destination)) {
        setDragWarning(true);
        return;
      }
      const destinationWorkDay = destination.droppableId;
      const destinationDateMoment = getDroppableDate(destination.droppableId);
      const destinationDate = destinationDateMoment.format('YYYY-MM-DD');
      const newSourceItems = { ...plannedActivitiesByDay }[sourceWorkDay];
      let newDestinationItems = { ...plannedActivitiesByDay }[destinationWorkDay];
      const movedItem = newSourceItems.splice(source.index, 1)[0];
      newDestinationItems = [
        ...newDestinationItems.slice(0, destination.index),
        movedItem,
        ...newDestinationItems.slice(destination.index, newDestinationItems.length)
      ];
      setPlannedActivitiesByDay((oldValue) => ({
        ...oldValue,
        [sourceWorkDay]: newSourceItems,
        [destinationWorkDay]: newDestinationItems,
      }));
      newSourceItems.forEach((item, index) => {
        axios.patch(`/api/classrooms/${classroomId}/planned-activities/${item.id}`, { position: index })
      });
      const promises = [];
      newDestinationItems.forEach((item, index) => {
        promises.push(
          axios.patch(`/api/classrooms/${classroomId}/planned-activities/${item.id}`, {
            position: index,
            plannedDate: destinationDate,
          })
        )
      })
      const responses = await Promise.all(promises);
      const updatedPlannedActivities = responses.map((response) => response.data);
      setDynamicPlannedActivities((oldValue) => {
        const newPlannedActivities = [...oldValue];
        updatedPlannedActivities.forEach((updatedPA) => {
          const plannedActivityIndex = newPlannedActivities.findIndex((pa) => pa.id === updatedPA.id);
          newPlannedActivities[plannedActivityIndex] = updatedPA;
        })
        return newPlannedActivities;
      })
    } else {
      const newItems = { ...plannedActivitiesByDay }[sourceWorkDay];
      const movedItem = { ...newItems[source.index] };
      newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);
      newItems.forEach((item, index) => {
        axios.patch(`/api/classrooms/${classroomId}/planned-activities/${item.id}`, { position: index })
      })
      setPlannedActivitiesByDay((oldValue) => ({ ...oldValue, [sourceWorkDay]: newItems }));
    }
  }

  const toggleCopying = () => {
    setCopying((oldValue) => !oldValue);
  }

  const handleSelectPlannedActivity = ({ id, activity, date }) => {
    const index = selectedPlannedActivities.findIndex((plannedActivity) => plannedActivity.id === id)
    const plannedActivityIndex = dynamicPlannedActivities.findIndex((plannedActivity) => plannedActivity.id === id)
    const position = dynamicPlannedActivities[plannedActivityIndex].position ?? plannedActivityIndex;
    let newSelectedActivities = [];
    if (index !== -1) {
      newSelectedActivities = [
        ...selectedPlannedActivities.slice(0, index),
        ...selectedPlannedActivities.slice(index + 1, selectedPlannedActivities.length),
      ];
    } else {
      newSelectedActivities = [...selectedPlannedActivities, { id, activity, date, position }];
    }
    setSelectedPlannedActivities(newSelectedActivities);
  }

  const handleSelectAllActivities = () => {
    setSelectedPlannedActivities(dynamicPlannedActivities.map(
      (plannedActivity, i) => ({
        id: plannedActivity.id,
        activity: plannedActivity.activity.id,
        date: plannedActivity.plannedDate,
        position: plannedActivity.position ?? i,
      })
    ));
  }

  const isSelected = (plannedActivityId) =>
    selectedPlannedActivities
      .map((plannedActivity) => plannedActivity.id)
      .includes(plannedActivityId)

  const handleCopy = async (toClassroom) => {
    handleCloseCopyMenu();
    setCopyQuery({ loading: true });
    const promises = selectedPlannedActivities.map(({ activity, date, position }) => (
      axios.post(`/api/institutions/${institution.id}/activities/${activity}/plan`, {
        classroom: toClassroom.id,
        date,
        position,
      })
    ))
    try {
      await Promise.all(promises);
      setCopyQuery({ success: true });
      toggleCopying();
      setSelectedPlannedActivities([]);
    } catch {
      setCopyQuery({ error: true });
    }
    // trackCopyLessonPlan({
    //   fromClassroom: classroom.name,
    //   toClassroom: toClassroom.name,
    //   totalActivities: selectedPlannedActivities.length,
    // })
  };

  const steps = [
    {
      target: '#calendar-tooltip',
      content: 'Este es el calendario, aquí puedes planificar experiencias para cada día de la semana.',
      disableBeacon: true,
    },
    {
      target: '#suggest-calendar-button',
      content: 'Puedes usar este botón y te sugeriremos experiencias para la semana completa.',
      disableBeacon: true,
    },
    {
      target: '#tour-date-container',
      content: 'Planifiquemos una experiencia para este día.',
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: '#tour-date-add-button',
      content: "Este es el botón que se debe presionar para planificar una experiencia. Por ahora solo presiona 'Siguiente'",
      disableBeacon: true,
      placement: 'right',
    },
  ];

  const endSteps = [
    {
      target: '#calendar-tooltip',
      content: '¡Listo! Planificaste tu primera experiencia',
      disableBeacon: true,
    },
    {
      target: '#tour-date-container',
      content: 'La puedes ver aquí',
      disableBeacon: true,
      placement: 'right',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status, type, step: { target } } = data;
    if (status === STATUS.FINISHED && type === 'tour:end') {
      if (target === '#tour-date-container') {
        finishTour();
      } else {
        // trackOnboardingStep('Lesson Plan To Library');
        const dateToPlan = IS_WEEKEND ? moment().startOf('week') : moment();
        router.push(`${indexBaseUrl}?classroomId=${classroomId}&date=${dateToPlan.format('YYYY-MM-DD')}`)
      }
    }
  }

  const SuggestWeekButton = () => {
    const { plansFromIndividualStandOut } = usePlans();
    const handleNeedsToUpgrade = usePlanUpgradeWarning();
    if (!plansFromIndividualStandOut.includes(plan)) {
      return (
        <Button
          variant="outlined"
          startIcon={<LockOutlined />}
          onClick={handleNeedsToUpgrade}
          color="info"
          id="suggest-calendar-button"
        >
          Semana sugerida
        </Button>
      )
    }
    return (
      <Button
        variant="outlined"
        startIcon={<AutoFixHighOutlined />}
        onClick={() => setOpenSuggestWeekDialog(true)}
        color="info"
        id="suggest-calendar-button"
      >
        Semana sugerida
      </Button>
    )
  }

  const isCurrentWeek = moment().isBetween(selectedStartOfWeek, moment(selectedEndOfWeek).add(1, 'day'));
  const theme = useTheme();
  const color = isCurrentWeek ? theme.palette.primary.main : 'inherit';
  const startDate = moment(selectedStartOfWeek).format('YYYY-MM-DD');
  const endDate = moment(selectedEndOfWeek).format('YYYY-MM-DD');
  const printableFullUrl = `/classes/${classroomId}/lesson-plan/printable-full`;
  const printableTableUrl = `/classes/${classroomId}/lesson-plan/printable-table`;
  const printableSummaryUrl = `/classes/${classroomId}/lesson-plan/printable-calendar?startDate=${startDate}&endDate=${endDate}`;

  return (
    <Stack pb={2}>
      <Head>
        <title>Planificación {classroom.name}</title>
      </Head>
      <Box id="calendar-tooltip" position="absolute" top="10%" left="50%" width={0} height={0} />
      <UngaJoyride
        steps={endSteps}
        callback={handleJoyrideCallback}
        locale={{
          last: 'Siguiente',
        }}
        scrollOffset={200}
        hide={onboardingType !== 'end'}
      />
      <UngaJoyride
        steps={steps}
        callback={handleJoyrideCallback}
        locale={{
          last: 'Siguiente',
        }}
        scrollOffset={200}
        hide={onboardingType === 'end'}
      />
      <TutorialLink id="8dc177f57e5b4a9eac590a7cde1da9b6" />
      <Stack
        direction={{ xs: 'column-reverse', sm: 'row' }}
        alignItems={{ xs: 'center', sm: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
        mt={2}
      >
        <Stack alignItems={{ xs: 'center', sm: 'flex-start' }}>
          <Stack direction="row" alignItems="center" spacing={4}>
            <Stack direction="row" alignItems="center">
              <IconButton onClick={handleWeekBack}>
                <ArrowBack color="primary" />
              </IconButton>
              <Typography color={color}>{moment(selectedStartOfWeek).format('DD MMM')}</Typography>
            </Stack>
            <Typography color={color}>al</Typography>
            <Stack direction="row" alignItems="center">
              <Typography color={color}>{moment(selectedEndOfWeek).format('DD MMM')}</Typography>
              <IconButton onClick={handleWeekForward}>
                <ArrowForward color="primary" />
              </IconButton>
            </Stack>
          </Stack>
          {!isCurrentWeek && (
            <Button
              variant="text"
              onClick={goToCurrentWeek}
            >
              Ir a semana actual
            </Button>
          )}
        </Stack>
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2}>
          {features?.includes('suggestCalendar') && (
            <SuggestWeekButton />
          )}
          {editAccessClassrooms.length > 0 && (
            <>
              {!copying ? (
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={toggleCopying}
                >
                  Copiar planificación
                </Button>
              ) : (
                <Stack direction="row" justifyContent="space-between" spacing={{ sm: 2 }}>
                  {selectedPlannedActivities.length > 0 ? (
                    <>
                      <LoadingButton
                        variant="outlined"
                        onClick={handleOpenCopyMenu}
                        loading={copyQuery.loading}
                      >
                        Copiar experiencias
                      </LoadingButton>
                      <Menu
                        id="copy-basic-menu"
                        anchorEl={copyMenuAnchorEl}
                        open={Boolean(copyMenuAnchorEl)}
                        onClose={handleCloseCopyMenu}
                        MenuListProps={{
                          'aria-labelledby': 'copy-button',
                        }}
                      >
                        {editAccessClassrooms.map((classroom) => (
                          <MenuItem key={classroom.id} onClick={() => handleCopy(classroom)}>
                            {classroom.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={handleSelectAllActivities}
                    >
                      Seleccionar todas
                    </Button>
                  )}
                  <Button
                    variant="text"
                    color="error"
                    onClick={toggleCopying}
                  >
                    Cancelar copia
                  </Button>
                </Stack>
              )}
            </>
          )}
          <Button
            variant="contained"
            endIcon={<ExpandMore />}
            onClick={handleOpenPrintMenu}
          >
            Imprimir o descargar
          </Button>
          <Menu
            id="print-basic-menu"
            anchorEl={printMenuAnchorEl}
            open={Boolean(printMenuAnchorEl)}
            onClose={handleClosePrintMenu}
            MenuListProps={{
              'aria-labelledby': 'print-button',
            }}
          >
            <Link noLinkStyle href={`${printableFullUrl}?startDate=${startDate}&endDate=${endDate}`}>
              <MenuItem>Calendario</MenuItem>
            </Link>
            <Link noLinkStyle href={`${printableTableUrl}?startDate=${startDate}&endDate=${endDate}`}>
              <MenuItem>Tabla</MenuItem>
            </Link>
            <Link noLinkStyle href={printableSummaryUrl}>
              <MenuItem>Resumen</MenuItem>
            </Link>
            {/* <Link noLinkStyle href={printableLeanUrl}>
              <MenuItem>Solo objetivos e indicadores</MenuItem>
            </Link> */}
          </Menu>
        </Stack>
      </Stack>
      {plannedActivitiesPreparation.loading ? <UngaCircularProgress /> : (
        <Box mt={4}>
          {plannedActivitiesPreparation.error ? (
            <UngaError text="No pudimos traer tu planificación de esta semana" />
          ) : (
            <WeeklyActivitiesCalendar
              withAdd
              withPrint
              planned
              addBaseUrl={indexBaseUrl}
              printableFullUrl={printableFullUrl}
              printableTableUrl={printableTableUrl}
              classroomId={classroomId}
              startOfWeek={selectedStartOfWeek}
              activitiesByDay={plannedActivitiesByDay}
              copying={copying}
              handleSelectPlannedActivity={handleSelectPlannedActivity}
              checkIfPlannedActivityIsSelected={isSelected}
              onDragEnd={onDragEnd}
              calendarEvents={dynamicCalendarEvents}
            />
          )}
        </Box>
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={dragWarning}
        onClose={() => setDragWarning(false)}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setDragWarning(false)} severity="warning" sx={{ width: '100%' }}>
          No puedes mover actividades desde o hacia días del pasado
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={copyQuery.error}
        onClose={() => setCopyQuery({})}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setCopyQuery({})} severity="error" sx={{ width: '100%' }}>
          No pudimos copiar la planificación
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={copyQuery.success}
        onClose={() => setCopyQuery({})}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setCopyQuery({})} severity="success" sx={{ width: '100%' }}>
          Planificación copiada con éxito
        </Alert>
      </Snackbar>
      <UngaFullScreenDialog
        open={openSuggestWeekDialog}
        onClose={() => setOpenSuggestWeekDialog(false)}
      >
        <SuggestedWeeklyCalendar
          classroomId={classroomId}
          startOfWeek={startDate}
          onCancel={() => setOpenSuggestWeekDialog(false)}
          getPlannedActivities={() => getPlannedActivities(selectedStartOfWeek, selectedEndOfWeek)}
        />
      </UngaFullScreenDialog>
    </Stack>
  )
}