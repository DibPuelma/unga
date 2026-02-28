import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import _ from 'lodash';
import { Box, Typography } from "@mui/material";
import moment from "moment-timezone";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import { ATTENDANCE_TYPES } from "db/attendance";
import StudentAttendanceHeatMap from "./StudentAttendanceHeatMap";
import AttendanceDaysTable from "./AttendanceDaysTable";
import { AttendanceMonthsLineGraph } from "./AttendanceMonthsLineGraph";
import AttendanceStats from "./AttendanceStats";
import ClassroomAttendanceTable from "./ClassroomAttendanceTable";

export default function AttendanceShowcase({
  studentId,
  classroomId,
  students,
  startDate = moment().startOf('year').format('YYYY-MM-DD'),
  endDate = moment().format('YYYY-MM-DD'),
  onDateSelect,
  selectedDate: propsSelectedDate,
}) {
  const now = moment();
  const [allAttendances, setAllAttendances] = useState(null);
  const [attendanceAnalyticsByMonth, setAttendanceAnalyticsByMonth] = useState(null);
  const [attendanceAnalyticsByDate, setAttendanceAnalyticsByDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDate, setSelectedDate] = useState(propsSelectedDate);
  const [filteredAttendanceByDate, setFilteredAttendanceByDate] = useState({});
  const hasInitializedMonth = useRef(false);

  const currentYearAttendance = useMemo(() => {
    if (!attendanceAnalyticsByDate) return;
    const newCurrentYearAttendance = ATTENDANCE_TYPES.reduce((acc, type) => {
      acc[`${type}Percentage`] = 0;
      return acc;
    }, {});
    const allAttendances = Object.values(attendanceAnalyticsByDate)
    allAttendances.forEach((attendances) => {
      ATTENDANCE_TYPES.forEach((type) => {
        if (!attendances[`${type}Percentage`]) return;

        newCurrentYearAttendance[`${type}Percentage`] += attendances[`${type}Percentage`];
      })
    })
    ATTENDANCE_TYPES.forEach((type) => newCurrentYearAttendance[`${type}Percentage`] /= allAttendances.length);
    return newCurrentYearAttendance;
  }, [attendanceAnalyticsByDate]);

  useEffect(() => {
    const getData = async () => {
      try {
        let path = '';
        if (studentId) {
          path = `/api/classrooms/${classroomId}/students/${studentId}/attendance?startDate=${startDate}&endDate=${endDate}&analyticsByMonth=true`;
          // For student view, only fetch analytics data
          const analyticsResponse = await axios.get(path);
          setAttendanceAnalyticsByMonth(analyticsResponse.data.analyticsByMonth);
          setAttendanceAnalyticsByDate(analyticsResponse.data.analyticsByDate);
          // Set allAttendances to empty array for student view (not used but needed for loading check)
          setAllAttendances([]);
        } else {
          // For classroom view, fetch both attendance data and analytics
          path = `/api/classrooms/${classroomId}/attendance?startDate=${startDate}&endDate=${endDate}&analyticsByMonth=true`;
          const [attendanceResponse, analyticsResponse] = await Promise.all([
            axios.get(`/api/classrooms/${classroomId}/attendance?startDate=${startDate}&endDate=${endDate}`),
            axios.get(path)
          ]);
          setAttendanceAnalyticsByMonth(analyticsResponse.data.analyticsByMonth);
          setAttendanceAnalyticsByDate(analyticsResponse.data.analyticsByDate);
          setAllAttendances(attendanceResponse.data);
        }
        // Reset initialization flag when data is refetched
        hasInitializedMonth.current = false;
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        // Set empty states on error to prevent infinite loading
        setAttendanceAnalyticsByMonth({});
        setAttendanceAnalyticsByDate({});
        setAllAttendances([]);
      }
    }
    getData();
  }, [studentId, classroomId, startDate, endDate])

  const handleSelectMonth = useCallback((month) => {
    setSelectedMonth((prevSelectedMonth) => {
      if (month === prevSelectedMonth) {
        setFilteredAttendanceByDate({});
        return null;
      }
      if (!attendanceAnalyticsByDate) return prevSelectedMonth;
      // Convert month number to padded string (e.g., 1 -> "01", 12 -> "12")
      const monthString = String(month).padStart(2, '0');
      const dates = Object.keys(attendanceAnalyticsByDate).filter((date) => date.slice(5, 7) === monthString);
      const reduced = dates.reduce((acc, date) => {
        acc[date] = attendanceAnalyticsByDate[date];
        return acc;
      }, {});
      setFilteredAttendanceByDate(reduced);
      return month;
    });
  }, [attendanceAnalyticsByDate]);

  useEffect(() => {
    if (!attendanceAnalyticsByDate || hasInitializedMonth.current) return;
    const currentMonth = now.month() + 1;
    // Convert month number to padded string (e.g., 1 -> "01", 12 -> "12")
    const monthString = String(currentMonth).padStart(2, '0');
    const dates = Object.keys(attendanceAnalyticsByDate).filter((date) => date.slice(5, 7) === monthString);
    const reduced = dates.reduce((acc, date) => {
      acc[date] = attendanceAnalyticsByDate[date];
      return acc;
    }, {});
    setFilteredAttendanceByDate(reduced);
    setSelectedMonth(currentMonth);
    hasInitializedMonth.current = true;
  }, [attendanceAnalyticsByDate]);

  useEffect(() => setSelectedDate(propsSelectedDate), [propsSelectedDate])

  const handleSelectDate = (date) => {
    if (!onDateSelect) return;
    setSelectedDate(date);
    onDateSelect(date);
  }

  // For student view, allAttendances is not needed, so only check it for classroom view
  // Check if analytics data has been fetched (not null/undefined)
  if (attendanceAnalyticsByDate === null || attendanceAnalyticsByMonth === null || (!studentId && allAttendances === null)) {
    return <UngaCircularProgress height={80} />;
  }

  return (
    <>
      {!studentId && (
        <>
          {students && (
            <Box mb={8}>
              <Typography variant="h6" gutterBottom>Mensual</Typography>
              <ClassroomAttendanceTable
                startDate={startDate}
                endDate={endDate}
                students={students}
                attendances={allAttendances}
                attendanceAnalyticsByMonth={attendanceAnalyticsByMonth}
              />
            </Box>
          )}
          <Box mb={8}>
            <Typography variant="h6" gutterBottom>Anual</Typography>
            <AttendanceStats stats={currentYearAttendance} />
            <AttendanceMonthsLineGraph attendanceAnalyticsByMonth={attendanceAnalyticsByMonth} />
          </Box>
        </>
      )}
      {selectedMonth && !studentId && (
        <AttendanceDaysTable
          filteredAttendanceByDate={filteredAttendanceByDate}
          selectedDate={selectedDate}
          onDateSelect={handleSelectDate}
        />
      )}
      {studentId && (
        <>
          <Box mb={8}>
            <Typography variant="h6" gutterBottom>Asistencia diaria</Typography>
            <StudentAttendanceHeatMap attendanceAnalyticsByDate={attendanceAnalyticsByDate} />
          </Box>
          <Box mb={8}>
            <Typography variant="h6" gutterBottom>Asistencia mensual</Typography>
            <AttendanceMonthsLineGraph
              attendanceAnalyticsByMonth={attendanceAnalyticsByMonth}
            />
          </Box>
          <Box mb={8}>
            <Typography variant="h6">Asistencia anual {moment().year()}</Typography>
            <AttendanceStats stats={currentYearAttendance} />
          </Box>
        </>
      )}
    </>
  );
}