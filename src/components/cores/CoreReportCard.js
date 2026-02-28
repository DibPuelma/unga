import React, { useContext } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Grid,
} from '@mui/material';
import { getLevelOfAchievementValueColor } from 'src/helpers/businessLogic';
import { UserContext } from 'src/context/UserContext';
import { AdvancedReportContext } from 'src/context/AdvancedReportContext';

export default function CoreReportCard({ core }) {
  const { levelsOfAchievement } = useContext(UserContext)
  const { printing } = useContext(AdvancedReportContext)
  const timePeriods = Object.keys(core.advancement);
  const lastTimePeriod = timePeriods[timePeriods.length - 1];
  const color = getLevelOfAchievementValueColor(core.advancement[lastTimePeriod].advancementValue, levelsOfAchievement.length - 1);

  const DataBody = (
    <Stack
      py={2}
      px={1}
      height="100%"
      justifyContent="space-between"
      color={color}
    >
      <Typography variant="h4" textAlign="center" color={color}>
      {core.advancement[lastTimePeriod].advancement.toFixed(0)}% | {core.advancement[lastTimePeriod].advancementTextAcronym}
      </Typography>
      <Typography textAlign="center">
        <b>{core.name}</b>
      </Typography>
      <Typography variant="body2" textAlign="center">
        {core.advancement[lastTimePeriod].totalEvaluations} de {core.advancement[lastTimePeriod].possibleEvaluations} evaluaciones
      </Typography>
    </Stack>
  )

  if (printing) {
    return (
      <Grid item xs={3}>
        {DataBody}
      </Grid>
    )
  }
  return (
    <Grid item xs={6} sm={4} md={3} p={1}>
      <Paper elevation={4} sx={{ height: '100%' }}>
        {DataBody}
      </Paper>
    </Grid >
  )
};
