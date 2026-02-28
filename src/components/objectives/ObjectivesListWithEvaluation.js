import React, { useContext, useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import ChooseLevelOfAchievement from '../levelsOfAchievement/ChooseLevelOfAchievement';

import LevelsOfAchievementHeader from '../levelsOfAchievement/LevelsOfAchievementHeader';
import AdvancementCalculationService from 'services/AdvancementCalculationService';
import { UserContext } from 'src/context/UserContext';
import moment from 'moment-timezone';

export default function ObjectivesListWithEvaluation({
  objectives,
  student,
  onEvaluation,
}) {
  const { levelsOfAchievement } = useContext(UserContext);
  const [dynamicObjectives, setDynamicObjectives] = useState([]);

  useEffect(() => {
    setDynamicObjectives(
      objectives.map((objective) => AdvancementCalculationService.addStudentAdvancementToObjective(
        objective,
        levelsOfAchievement
      ))
    );
  }, []);

  const handleObjectiveEvaluation = ({ objectiveId, levelOfAchievement }) => {
    const index = dynamicObjectives.findIndex((obj) => obj.id === objectiveId);
    const newObjectives = [...dynamicObjectives];
    newObjectives[index] = {
      ...newObjectives[index],
      levelOfAchievement,
      evaluatedAt: moment().toISOString(),
    };
    newObjectives[index] = AdvancementCalculationService.addStudentAdvancementToObjective(
      newObjectives[index],
      levelsOfAchievement
    );
    setDynamicObjectives(newObjectives);
    onEvaluation(newObjectives)
  };

  const handleSubObjectiveEvaluation = ({ objectiveId, subObjectiveId, levelOfAchievement }) => {
    const objectiveIndex = dynamicObjectives.findIndex((obj) => obj.id === objectiveId);
    const subIndex = dynamicObjectives[objectiveIndex].subObjectives.findIndex(
      (subObj) => subObj.id === subObjectiveId
    );
    const newObjectives = [...dynamicObjectives];
    newObjectives[objectiveIndex].subObjectives[subIndex] = {
      ...newObjectives[objectiveIndex].subObjectives[subIndex],
      levelOfAchievement,
      evaluatedAt: moment().toISOString(),
    };
    newObjectives[objectiveIndex] = AdvancementCalculationService.addStudentAdvancementToObjective(
      newObjectives[objectiveIndex],
      levelsOfAchievement
    );
    setDynamicObjectives(newObjectives);
    onEvaluation(newObjectives)
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={5} sm={4} />
        <Grid item xs={7} sm={8}>
          <LevelsOfAchievementHeader />
        </Grid>
        {dynamicObjectives.map((objective) => (
          <Grid container key={objective.id} pl={2} pb={3} alignItems="center">
            <Grid item xs={5} sm={4}>
              <Typography fontSize={12} lineHeight={1.4}>
                {objective.name}
              </Typography>
            </Grid>
            <Grid item xs={7} sm={8}>
              <ChooseLevelOfAchievement
                advancement={objective.advancement}
                currentValue={objective.levelOfAchievement?.id}
                student={student}
                objective={objective}
                onChange={handleObjectiveEvaluation}
              />
            </Grid>
            {objective.subObjectives?.map((subObjective) => (
              <React.Fragment key={subObjective.id}>
                <Grid item xs={5} sm={4}>
                  <Typography fontSize={12} color="GrayText">
                    {subObjective.name}
                  </Typography>
                </Grid>
                <Grid item xs={7} sm={8}>
                  <ChooseLevelOfAchievement
                    currentValue={subObjective.levelOfAchievement?.id}
                    student={student}
                    objective={subObjective}
                    onChange={({ levelOfAchievement }) => handleSubObjectiveEvaluation({
                      subObjectiveId: subObjective.id,
                      objectiveId: objective.id,
                      levelOfAchievement,
                    })}
                    size="small"
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
