import { PrintOutlined } from "@mui/icons-material";
import { Button, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_SPANISH } from "db/attendance";
import moment from "moment-timezone";
import { useContext, useMemo, useRef, useState } from "react";
import { enumerateMonthsBetweenDates, enumerateWorkDaysBetweenDates } from "src/helpers/dates";
import { toAcronym } from "src/helpers/strings";
import { useReactToPrint } from 'react-to-print';
import { UserContext } from "src/context/UserContext";
import UngaRatioImage from "../utils/UngaRatioImage";
import AttendanceStats from "./AttendanceStats";

function attendanceTypeForStudentDate(attendances, studentId, dateMoment) {
  const list = Array.isArray(attendances) ? attendances : [];
  const row = list.find((attendance) => {
    const attendStudentId = attendance.student?.id ?? attendance.studentId;
    return (
      attendStudentId === studentId &&
      moment(attendance.attendanceDate).format('YYYY-MM-DD') === dateMoment.format('YYYY-MM-DD')
    );
  });
  return row?.attendanceType;
}

export default function ClassroomAttendanceTable({
  startDate,
  endDate,
  students,
  attendances,
  attendanceAnalyticsByMonth,
}) {
  const { selectedClassroom, institution } = useContext(UserContext);
  const [selectedMonth, setSelectedMonth] = useState(moment(endDate).format('MMMM'));
  const allDates = enumerateWorkDaysBetweenDates(startDate, endDate, 'YYYY-MM-DD');
  const allMonths = enumerateMonthsBetweenDates(startDate, endDate, 'MMMM');
  const monthDates = useMemo(() =>
    allDates.filter((date) => moment(date).format('MMMM') === selectedMonth).map((date) => moment(date))
    , [selectedMonth]);
  const monthNumber = useMemo(() => moment(selectedMonth, 'MMMM').format('MM'), [selectedMonth]);
  const componentToPrintRef = useRef();

  const handleTabChange = (_, newValue) => {
    setSelectedMonth(newValue);
  }

  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    pageStyle: `size: letter landscape; margin: 3cm;`
  });

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Tabs value={selectedMonth} onChange={handleTabChange} aria-label="Tabs para cambiar de mes" variant="scrollable">
          {allMonths.map((month) => (
            <Tab key={month} label={month[0].toUpperCase() + month.slice(1)} value={month} />
          ))}
        </Tabs>
        <Button
          variant="contained"
          startIcon={<PrintOutlined />}
          onClick={handlePrint}
        >
          Imprimir asistencia
        </Button>
      </Stack>
      <AttendanceStats stats={attendanceAnalyticsByMonth[monthNumber]} />
      <TableContainer sx={{ mt: 1, width: '75vw', overflow: 'scroll' }}>
        <Table size="small" padding="none">
          <TableHead>
            <TableRow>
              <TableCell>Párvulo</TableCell>
              {monthDates.map((date) => (
                <TableCell key={date}>
                  {date.format('DD')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  {student.firstName} {student.lastName}
                </TableCell>
                {monthDates.map((date) => {
                  const attendanceType = attendanceTypeForStudentDate(attendances, student.id, date);
                  return (
                    <TableCell key={date}>
                      {attendanceType ? toAcronym(ATTENDANCE_TYPES_TO_SPANISH[attendanceType]) : 'SR'}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer sx={{ mt: 2, width: '75vw', overflow: 'scroll', display: 'none' }}>
        <Table ref={componentToPrintRef}>
          <TableBody>
          {institution.logo && (
            <TableRow>
              <UngaRatioImage image={institution.logo} baseHeight={80} />
            </TableRow>
          )}
          <TableRow>
            <Typography mb={1}>
              Asistencia {selectedMonth} {moment(endDate).format('YYYY')} {selectedClassroom.name}.
            </Typography>
          </TableRow>
          </TableBody>
          <Table size="small" padding="none" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Párvulo</TableCell>
                {monthDates.map((date) => (
                  <TableCell key={date}>
                    {date.format('DD')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell sx={{ maxWidth: 10 }}>
                    <Typography maxWidth={150} variant="body2">
                      {student.firstName} {student.lastName}
                    </Typography>
                  </TableCell>
                  {monthDates.map((date) => {
                    const attendanceType = attendanceTypeForStudentDate(attendances, student.id, date);
                    return (
                      <TableCell key={date}>
                        {attendanceType ? toAcronym(ATTENDANCE_TYPES_TO_SPANISH[attendanceType]) : 'SR'}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TableRow sx={{ fontSize: 12 }}>
            {ATTENDANCE_TYPES.map((attendanceType) => `${toAcronym(ATTENDANCE_TYPES_TO_SPANISH[attendanceType])}: ${ATTENDANCE_TYPES_TO_SPANISH[attendanceType]}`).join(', ')}.
          </TableRow>
        </Table>
      </TableContainer>
    </>
  )
}