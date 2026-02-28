import React, { useContext, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { UserContext } from '../../context/UserContext';

export default function ObjectiveEvaluationData({ objective }) {
  const { levelsOfAchievement } = useContext(UserContext);
  const maxLevelOfAchievement = Math.max(...levelsOfAchievement.map((loa) => loa.value));

  const evaluatedStudents = useMemo(() => {
    return objective.studentsLevelOfAchievement
      .filter((studloa) => studloa.levelOfAchievement.value !== 0)
  }, [objective])

  const advancement = useMemo(() => {
    if (evaluatedStudents.length > 0) {
      return (
        (
          evaluatedStudents.reduce(
            (prev, sloa) => prev + sloa.levelOfAchievement.value, 0
          ) / (maxLevelOfAchievement * evaluatedStudents.length)
        ).toFixed(2)
      )
    }
    return 0;
  }, [evaluatedStudents]);

  return (
    <Box>
      <Typography variant="h4">
        {parseInt(advancement * 100, 10)}%
      </Typography>
      <Typography variant="body2">
        ({evaluatedStudents.length} de {objective.studentsLevelOfAchievement.length} evaluaciones)
      </Typography>
    </Box>
  )
}