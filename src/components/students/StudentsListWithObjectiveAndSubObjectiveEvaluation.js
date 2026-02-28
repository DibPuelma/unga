import React, { useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';

import ChooseLevelOfAchievement from '../levelsOfAchievement/ChooseLevelOfAchievement';
import LevelsOfAchievementHeader from '../levelsOfAchievement/LevelsOfAchievementHeader';

export default function StudentsListWithObjectiveAndSubObjectiveEvaluation({
  objective,
  handleObjectiveEvaluation,
  handleSubObjectiveEvaluation,
  evaluationDate,
}) {
  const levelsOfAchievementWithSubObjectives = useMemo(() => {
    // Ensure subObjectives is always an array
    const subObjectives = objective.subObjectives || [];
    
    return objective.studentsLevelOfAchievement.map((studentLevelOfAchievement) => ({
      ...studentLevelOfAchievement,
      subObjectives: subObjectives.map((subObjective) => ({
        ...subObjective,
        levelOfAchievement: subObjective.studentsLevelOfAchievement?.find(
          (sloa) => sloa.student.id === studentLevelOfAchievement.student.id
        )?.levelOfAchievement,
      }))
    }))
  },
    [objective]
  )

  return (
    <Box>
      <Grid container sx={{ mb: 2 }} justifyContent="space-between">
        <Grid container>
          <Grid item xs={6} md={4} />
          <Grid item xs={6} md={8}>
            <LevelsOfAchievementHeader />
          </Grid>
        </Grid>
        {levelsOfAchievementWithSubObjectives
          .sort((a, b) => a.student.name < b.student.name ? -1 : 1)
          .map((studentLevelOfAchievement) => (
            <Grid container key={studentLevelOfAchievement.student.id} pb={4} alignItems="center">
              <Grid item xs={6} md={4}>
                <Typography>
                  {studentLevelOfAchievement.student.fullName}
                </Typography>
              </Grid>
              <Grid item xs={6} md={8}>
                <ChooseLevelOfAchievement
                  advancement={studentLevelOfAchievement.advancement}
                  onChange={handleObjectiveEvaluation}
                  currentValue={studentLevelOfAchievement.levelOfAchievement?.id}
                  student={studentLevelOfAchievement.student}
                  objective={objective}
                />
              </Grid>
              {studentLevelOfAchievement.subObjectives.map((subObjective) => (
                <React.Fragment key={subObjective.id}>
                  <Grid item xs={6} md={4}>
                    <Typography fontSize={12} color="GrayText">
                      {subObjective.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={8}>
                    <ChooseLevelOfAchievement
                      currentValue={subObjective.levelOfAchievement?.id}
                      onChange={handleSubObjectiveEvaluation}
                      student={studentLevelOfAchievement.student}
                      objective={subObjective}
                      size="small"
                      evaluationDate={evaluationDate}
                    />
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};
