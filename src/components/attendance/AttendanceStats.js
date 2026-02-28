import { Stack, Typography } from "@mui/material";
import { ATTENDANCE_TYPES, ATTENDANCE_TYPES_TO_SPANISH } from "db/attendance";
import { Fragment } from "react";

export default function AttendanceStats({ stats, withCount = false }) {
  if (!stats) return null;
  
  return (
    <Stack direction="row" flexWrap="wrap" columnGap={2}>
      {ATTENDANCE_TYPES.map((type) => {
        const count = stats[`${type}Count`] || 0;
        const percentage = stats[`${type}Percentage`] || 0;
        return (
        <Fragment key={type}>
          {withCount ? (
            <Typography key={type} fontSize={12}>
                <b>{count}</b> {ATTENDANCE_TYPES_TO_SPANISH[type]} ({(percentage * 100).toFixed(0)}%)
            </Typography>
          ) : (
            <Typography key={type} fontSize={12}>
                {ATTENDANCE_TYPES_TO_SPANISH[type]} {(percentage * 100).toFixed(0)}%
            </Typography>

          )}
        </Fragment>
        );
      })
      }
    </Stack >
  )
}