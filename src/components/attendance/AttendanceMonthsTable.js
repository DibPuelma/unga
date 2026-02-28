import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_SPANISH } from "db/attendance";
import moment from "moment-timezone";
import { toAcronym } from "src/helpers/strings";

export default function AttendanceMonthsTable({ attendanceByMonth, onMonthSelect, selectedMonth }) {
  const monthsNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const handleSelectMonth = (month) => {
    if (onMonthSelect) onMonthSelect(month);
  }

  return (
    <TableContainer sx={{ pb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {moment.months().map((month, i) => (
              <TableCell
                key={month}
                sx={(theme) => ({
                  cursor: onMonthSelect ? 'pointer' : 'inherit',
                  color: selectedMonth === monthsNumbers[i] ? theme.palette.primary.main : 'inherit',
                })}
                onClick={() => handleSelectMonth(monthsNumbers[i])}
              >
                {month[0].toLocaleUpperCase()}{month.slice(1)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            {monthsNumbers.map((month) => (
              <TableCell
                key={month}
                sx={(theme) => ({
                  cursor: onMonthSelect ? 'pointer' : 'inherit',
                  color: selectedMonth === month ? theme.palette.primary.main : 'inherit',
                })}
                onClick={() => handleSelectMonth(month)}
              >
                <Stack direction="row" columnGap={1}>
                  {ATTENDANCE_TYPES.map((type) => (
                    <Typography key={type} variant="caption">
                      {toAcronym(ATTENDANCE_TYPES_TO_SPANISH[type])}. {(attendanceByMonth[month][`${type}Percentage`] * 100).toFixed(2)}%
                    </Typography>
                  ))}
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}