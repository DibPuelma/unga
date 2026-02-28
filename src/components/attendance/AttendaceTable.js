import { useContext, useEffect, useMemo, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Radio,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';
import UngaCircularProgress from '../utils/UngaCircularProgress';
import moment from 'moment-timezone';
import { MixpanelContext } from 'services/MixpanelContext';
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_SPANISH } from 'db/attendance';
import AttendanceStats from './AttendanceStats';
import { ascendingSort } from 'src/helpers/arrays';

export default function AttendanceTable({ students, attendances, selectedDay, classroom }) {
  const classroomId = classroom.id;
  const { trackCreateAttendance, trackUpdateAttendance } = useContext(MixpanelContext);
  const [loading, setLoading] = useState(true);
  const [attendancesPerStudent, setAttendancesPerStudent] = useState({});
  const [studentsNameById, setStudentsNameById] = useState({});
  const [dynamicAttendances, setDynamicAttendances] = useState(attendances || []);
  const attendanceAnalytics = useMemo(() => {
    const initialValue = ATTENDANCE_TYPES.reduce((acc, type) => {
      acc[`${type}Percentage`] = 0;
      acc[`${type}Count`] = 0;
      return acc;
    }, {});
    if (!dynamicAttendances || !Array.isArray(dynamicAttendances)) return initialValue;
    dynamicAttendances.forEach((attendance) => {
      const { attendanceType } = attendance;
      initialValue[`${attendanceType}Count`] += 1;
      initialValue[`${attendanceType}Percentage`] += 1 / dynamicAttendances.length;
    })
    return initialValue;
  }, [dynamicAttendances])
  const [requestResponse, setRequestResponse] = useState({
    loading: false,
    success: false,
    error: false,
  })

  useEffect(() => {
    processData(dynamicAttendances, students)
    setLoading(false);
  }, [dynamicAttendances, students])

  const processData = (attendances, students) => {
    const newAttendancesPerStudent = {};
    const newStudentsNameById = {};
    const attendancesArray = Array.isArray(attendances) ? attendances : [];
    ascendingSort([...students], 'lastName').forEach((student) => {
      newStudentsNameById[student.id] = student.fullName;
      const studentAttendance = attendancesArray.find((attendance) => (
        attendance.student.id === student.id
      ))
      if (!studentAttendance) {
        newAttendancesPerStudent[student.id] = { attendanceType: 'present' };
      } else {
        newAttendancesPerStudent[student.id] = studentAttendance;
      }
    })
    setAttendancesPerStudent(newAttendancesPerStudent);
    setStudentsNameById(newStudentsNameById);
  }

  const handleChange = (student, attendanceType) => {
    const newAttendancesPerStudent = { ...attendancesPerStudent };
    if (newAttendancesPerStudent[student].id) {
      newAttendancesPerStudent[student] = {
        ...newAttendancesPerStudent[student],
        attendanceType
      };
    } else {
      newAttendancesPerStudent[student] = { attendanceType };
    }
    setAttendancesPerStudent(newAttendancesPerStudent);
  };

  const handleCreateAttendance = async () => {
    if (attendances.length > 0 && moment(selectedDay).isBefore(moment(), 'day')) return;
    setRequestResponse((oldValue) => ({ ...oldValue, loading: true }));
    try {
      let response = {};
      if (attendances.length > 0) {
        response = await axios.patch(`/api/classrooms/${classroomId}/attendance`, {
          attendancesPerStudent,
        })
        // trackUpdateAttendance({ classroomName: classroom.name, attendanceDate: selectedDay });
      } else {
        response = await axios.post(`/api/classrooms/${classroomId}/attendance`, {
          attendanceDate: selectedDay,
          attendancesPerStudent,
        })
        // trackCreateAttendance({ classroomName: classroom.name, attendanceDate: selectedDay });
      }
      setDynamicAttendances(response.data);
      setRequestResponse((oldValue) => ({ ...oldValue, success: true }));
    } catch (e) {
      setRequestResponse((oldValue) => ({ ...oldValue, error: true }));
    } finally {
      setRequestResponse((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const handleSnackbarClose = () => {
    setRequestResponse((oldValue) => ({ ...oldValue, error: false, success: false }));
  }

  if (loading) return <UngaCircularProgress />;

  const validAttendancesTypes = ATTENDANCE_TYPES.filter((type) => type !== 'notRegistered');

  return (
    <Stack spacing={2}>
      <Stack pl={{ xs: 0, sm: 2 }} direction={{ xs: 'column-reverse', sm: 'row' }} alignItems="flex-end" justifyContent="space-between">
        <AttendanceStats withCount stats={attendanceAnalytics} />
        <LoadingButton
          variant="contained"
          loading={requestResponse.loading}
          onClick={handleCreateAttendance}
          disabled={(attendances && attendances.length > 0) && moment(selectedDay).isBefore(moment(), 'day')}
        >
          Registrar asistencia {moment(selectedDay).format('ddd DD [de] MMM')}
        </LoadingButton>
      </Stack>
      <TableContainer>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ maxWidth: 100 }}>Párvulo</TableCell>
              {validAttendancesTypes.map((option, i) => (
                <TableCell sx={{ maxWidth: 100 }} key={option}>
                  {ATTENDANCE_TYPES_TO_SPANISH[option]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(attendancesPerStudent).map(([student, studentAttendance]) => (
              <TableRow
                key={student}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell sx={{ maxWidth: 100 }} component="th" scope="row">
                  {studentsNameById[student]}
                </TableCell>
                {validAttendancesTypes.map((attendanceType) => {
                  return (
                    <TableCell sx={{ maxWidth: 100 }} component="th" scope="row" key={attendanceType}>
                      <Radio
                        size="small"
                        checked={studentAttendance.attendanceType === attendanceType}
                        onChange={() => handleChange(student, attendanceType)}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={requestResponse.success}
        onClose={handleSnackbarClose}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Asistencia registrada con éxito
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={requestResponse.error}
        onClose={handleSnackbarClose}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          No se pudo registrar la asistencia
        </Alert>
      </Snackbar>
    </Stack>
  )
}