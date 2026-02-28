import { useTheme } from "@emotion/react";
import { Box, Stack, Typography } from "@mui/material";
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_COLOR, ATTENDANCE_TYPES_TO_SPANISH } from "db/attendance";

export default function AttendanceGraphLabels() {
  const theme = useTheme();

  return (
    <Stack direction="row" rowGap={0.5} columnGap={2} flexWrap="wrap">
      {ATTENDANCE_TYPES.map((type) => {
        const colorKey = ATTENDANCE_TYPES_TO_COLOR[type];
        const color = colorKey ? theme.palette[colorKey].light : theme.palette.grey[400];
        return (
          <Stack key={type} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 45, height: 15, backgroundColor: color }} />
            <Typography fontSize={12} sx={{ color: theme.palette.grey[600] }}>{ATTENDANCE_TYPES_TO_SPANISH[type]}</Typography>
          </Stack>
        )
      })}
    </Stack>
  );
}