import { useTheme } from "@emotion/react";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import axios from "axios";
import { getAttendanceByClassroomAndDates } from "db/attendance";
import { getClassroom } from "db/class";
import { getStudentsForClassroom } from "db/student";
import moment from "moment-timezone";
import Head from "next/head";
import { useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import PlansService from "services/PlansService";
import AttendanceTable from "src/components/attendance/AttendaceTable";
import AttendanceShowcase from "src/components/attendance/AttendanceShowcase";
import UngaCircularProgress from "src/components/utils/UngaCircularProgress";
import { serializeForNextProps } from "src/helpers/businessLogic";

const MOMENT_FORMAT = 'YYYY-MM-DD'
const START_OF_DAY = moment().startOf('day');

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.plansFromIndividualStandOut);
  if (!isAuthorizedValue) return returnValue;

  const { params: { classroomId }, query: { date } } = context;

  if (date && moment(date).isAfter(START_OF_DAY)) {
    return {
      redirect: {
        permanent: false,
        destination: context.resolvedUrl.split('?')[0]
      }
    }
  }

  const day = date || START_OF_DAY.format(MOMENT_FORMAT);


  const classroom = await getClassroom(classroomId);

  const attendances = await getAttendanceByClassroomAndDates(
    classroomId,
    day,
    day,
  );

  const students = await getStudentsForClassroom(classroomId);

  return {
    props: serializeForNextProps({
      attendances: Array.isArray(attendances) ? attendances : [],
      classroom,
      students,
      day,
    })
  }
}

export default function ClassroomAttendance({ attendances, classroom, students, day }) {
  const [selectedDay, setSelectedDay] = useState(day);
  const [dynamicAttendances, setDynamicAttendances] = useState(attendances);
  const [attendancesPreparation, setAttendancesPreparation] = useState({
    loading: false,
    error: false,
  })
  const classroomId = useMemo(() => classroom.id, [classroom]);

  const getAttendances = async (date) => {
    setAttendancesPreparation({ loading: true });
    const baseUrl = `/api/classrooms/${classroomId}/attendance`;
    const queryParams = `?startDate=${date}&endDate=${date}`;
    try {
      const response = await axios.get(`${baseUrl}${queryParams}`);
      setDynamicAttendances(response.data);
    } catch (error) {
      setAttendancesPreparation({ error: true })
      console.error(error)
    } finally {
      setAttendancesPreparation((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const goToCurrentDay = () => {
    if (selectedDay === day) return;
    setSelectedDay(day);
    getAttendances(day);
  }

  const goToSelectedDate = (date) => {
    if (selectedDay === date) return;
    setSelectedDay(date);
    getAttendances(date);
  }

  const handleDayBack = () => {
    let newDay = moment(selectedDay).subtract(1, 'days')
    if (newDay.day() === 0) {
      newDay = newDay.subtract(2, 'days').format(MOMENT_FORMAT);
    } else if (newDay.day() === 6) {
      newDay = newDay.subtract(1, 'day').format(MOMENT_FORMAT);
    } else {
      newDay = newDay.format(MOMENT_FORMAT);
    }
    setSelectedDay(newDay);
    getAttendances(newDay);
  }

  const handleDayForward = () => {
    let newDay = moment(selectedDay).add(1, 'days')
    if (newDay.day() === 0) {
      newDay = newDay.add(1, 'day').format(MOMENT_FORMAT);
    } else if (newDay.day() === 6) {
      newDay = newDay.add(2, 'days').format(MOMENT_FORMAT);
    } else {
      newDay = newDay.format(MOMENT_FORMAT);
    }
    setSelectedDay(newDay);
    getAttendances(newDay);
  }

  const isCurrentDay = moment().isSame(selectedDay, 'day');
  const theme = useTheme();
  const color = isCurrentDay ? theme.palette.primary.main : 'inherit';

  return (
    <Box pb={4}>
      <Head>
        <title>Asistencia {classroom.name}</title>
      </Head>
      <Box pt={2}>
        <Box mb={8}>
          <Typography variant="h6" gutterBottom>Diaria</Typography>
          <Stack alignItems="flex-start" mb={2}>
            <Stack direction="row" alignItems="center" spacing={4}>
              <Stack direction="row" alignItems="center">
                <IconButton onClick={handleDayBack}>
                  <ArrowBackIos fontSize="small" />
                </IconButton>
                <Typography color={color}>{moment(selectedDay).format('dddd DD [de] MMM')}</Typography>
                {!isCurrentDay && (
                  <IconButton onClick={handleDayForward}>
                    <ArrowForwardIos fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Stack>
            {!isCurrentDay && (
              <Button
                variant="text"
                onClick={goToCurrentDay}
              >
                Ir al día de hoy
              </Button>
            )}
          </Stack>
          {attendancesPreparation.loading ? <UngaCircularProgress /> : (
            <AttendanceTable
              students={students}
              attendances={dynamicAttendances}
              selectedDay={selectedDay}
              classroom={classroom}
            />
          )}
        </Box>
        <AttendanceShowcase
          classroomId={classroomId}
          students={students}
          startDate={moment().startOf('year').format('YYYY-MM-DD')}
          endDate={moment().format('YYYY-MM-DD')}
          selectedDate={selectedDay}
          onDateSelect={goToSelectedDate}
        />
      </Box>
    </Box>
  )
}