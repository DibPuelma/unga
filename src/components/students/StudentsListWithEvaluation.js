import React from 'react';
import { AccountCircle } from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';

import ChooseLevelOfAchievement from '../levelsOfAchievement/ChooseLevelOfAchievement';
import LevelsOfAchievementHeader from '../levelsOfAchievement/LevelsOfAchievementHeader';

export default function StudentsListWithEvaluation({
  objective,
  handleEvaluation,
  evaluationDate,
}) {
  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }} justifyContent="space-between">
        <Grid item xs={6} md={4} />
        <Grid item xs={6} md={8}>
          <LevelsOfAchievementHeader />
        </Grid>
        {objective.studentsLevelOfAchievement
          .sort((a, b) => a.student.name < b.student.name ? -1 : 1)
          .map((studentWithLevelOfAchievement) => (
            <React.Fragment key={studentWithLevelOfAchievement.student.id}>
              <Grid item xs={6} md={4}>
                <Typography>
                  {studentWithLevelOfAchievement.student.fullName}
                </Typography>
              </Grid>
              <Grid item xs={6} md={8}>
                <ChooseLevelOfAchievement
                  onChange={handleEvaluation}
                  currentValue={studentWithLevelOfAchievement.levelOfAchievement?.id}
                  student={studentWithLevelOfAchievement.student}
                  objective={objective}
                  evaluationDate={evaluationDate}
                />
              </Grid>
            </React.Fragment>
          ))}
      </Grid>
    </Box>
  );
};
