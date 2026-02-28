import React, { useContext, useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';

import ObjectiveEvaluationData from './ObjectiveEvaluationData';
import StudentsListWithObjectiveAndSubObjectiveEvaluation from '../students/StudentsListWithObjectiveAndSubObjectiveEvaluation';
import StudentsListWithEvaluation from '../students/StudentsListWithEvaluation';
import { UserContext } from 'src/context/UserContext';
import AdvancementCalculationService from 'services/AdvancementCalculationService';
import moment from 'moment-timezone';

export default function ExpandableObjectiveListItem({
  objective,
  withSubObjectives = false,
  onExpand,
  onCollapse,
  expanded: expandedProp = false,
  index,
  evaluationDate,
}) {
  const { levelsOfAchievement } = useContext(UserContext);
  const [objectiveDup, setObjectiveDup] = useState(objective);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(expandedProp);
  }, [expandedProp])

  useEffect(() => {
    setObjectiveDup(
      AdvancementCalculationService.addStudentsAdvancementToObjective(objective, levelsOfAchievement)
    );
  }, [objective])

  const handleExpansion = (e, expanded) => {
    setExpanded(expanded);
    if (expanded) {
      onExpand();
    } else {
      onCollapse();
    }
  };

  const handleObjectiveEvaluation = ({ studentId, levelOfAchievement }) => {
    setObjectiveDup((oldObjective) => {
      const index = oldObjective.studentsLevelOfAchievement
      .findIndex((sloa) => sloa.student.id === studentId);
      let newObjective = { ...oldObjective };
      newObjective.studentsLevelOfAchievement[index].levelOfAchievement = levelOfAchievement;
      newObjective.studentsLevelOfAchievement[index].evaluatedAt = moment().toISOString();
      newObjective = AdvancementCalculationService.addStudentsAdvancementToObjective(newObjective, levelsOfAchievement);
      return newObjective;
    })
  };
  
  const handleSubObjectiveEvaluation = ({ studentId, levelOfAchievement, objectiveId }) => {
    setObjectiveDup((oldObjective) => {
      const subObjectiveIndex = oldObjective.subObjectives.findIndex((subObjective) => subObjective.id === objectiveId);
      const sloaIndex = oldObjective.subObjectives[subObjectiveIndex].studentsLevelOfAchievement.findIndex(
        (sloa) => sloa.student.id === studentId
      );
      let newObjective = { ...oldObjective };
      newObjective.subObjectives[subObjectiveIndex].studentsLevelOfAchievement[sloaIndex].levelOfAchievement = levelOfAchievement;
      newObjective.subObjectives[subObjectiveIndex].studentsLevelOfAchievement[sloaIndex].evaluatedAt = moment().toISOString();
      newObjective = AdvancementCalculationService.addStudentsAdvancementToObjective(newObjective, levelsOfAchievement);
      return newObjective;
    })
  };

  return (
    <Stack spacing={0.5}>
      <Typography fontWeight="medium">{index + 1}. {objective.name}</Typography>
      <Accordion
        expanded={expanded}
        onChange={handleExpansion}
        sx={{ mb: 1 }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <Stack direction="row" width='100%' alignItems="flex-end">
          <AccordionSummary
            sx={{ width: '100%' }}
            aria-controls="panel1d-content"
            id="panel1d-header"
            expandIcon={<ExpandMoreIcon />}
          >
            <ObjectiveEvaluationData objective={objectiveDup} />
          </AccordionSummary>
        </Stack>
        <AccordionDetails>
          {withSubObjectives ? (
            <StudentsListWithObjectiveAndSubObjectiveEvaluation
              handleObjectiveEvaluation={handleObjectiveEvaluation}
              handleSubObjectiveEvaluation={handleSubObjectiveEvaluation}
              evaluationDate={evaluationDate}
              objective={objectiveDup}
            />
          ) : (
            <StudentsListWithEvaluation
              handleEvaluation={handleObjectiveEvaluation}
              evaluationDate={evaluationDate}
              objective={objectiveDup}
            />
          )}
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
};