import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_SPANISH } from "db/attendance";
import moment from "moment-timezone";
import { toAcronym } from "src/helpers/strings";

export default function AttendanceDaysTable({ filteredAttendanceByDate, selectedDate, onDateSelect }) {
  const handleSelectDate = (date) => {
    if (onDateSelect) onDateSelect(date);
  }

  return (
    <TableContainer sx={{ pb: 2 }}>
      <Table sx={{ minWidth: 650 }} size="small">
        <TableHead>
          <TableRow>
            {Object.keys(filteredAttendanceByDate).map((date) => (
              <TableCell
                key={date}
                sx={(theme) => ({
                  color: selectedDate === date ? theme.palette.primary.main : 'inherit',
                  cursor: onDateSelect ? 'pointer' : 'auto'
                })}
              >
                {moment(date).format('dd DD')}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            {Object.entries(filteredAttendanceByDate).map(([date, values]) => (
              <TableCell
                key={date}
                sx={(theme) => ({
                  color: selectedDate === date ? theme.palette.primary.main : 'inherit',
                  cursor: onDateSelect ? 'pointer' : 'auto'
                })}
                onClick={() => handleSelectDate(date)}
              >
                <Stack>
                  {ATTENDANCE_TYPES.map((type) => (
                    <Typography key={type} variant="caption">
                      {toAcronym(ATTENDANCE_TYPES_TO_SPANISH[type])}. {(values[`${type}Percentage`] * 100 || 0).toFixed(2)}%
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