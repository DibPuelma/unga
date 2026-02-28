import React, { useContext, useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  LinearProgress,
  Stack,
} from '@mui/material';

import ObjectivesListWithEvaluation from '../objectives/ObjectivesListWithEvaluation';

import CoreListItem from './CoreListItem';
import { UserContext } from '../../context/UserContext';
import { orderBy } from 'lodash';
import AdvancementCalculationService from 'services/AdvancementCalculationService';
import StudentEvaluationsHistory from '../evaluation/StudentEvaluationsHistory';

export default function ExpandableCoreListItem({
  core,
  student,
  objectives = 'objectives',
}) {
  const { levelsOfAchievement } = useContext(UserContext);
  const [dynamicCore, setDynamicCore] = useState(null);

  const recalculateValues = (newCore) => {
    setDynamicCore(AdvancementCalculationService.addStudentAdvancementToCore(newCore, levelsOfAchievement));
  };

  useEffect(() => {
    const lodashSortedObjectives = orderBy([...core.objectives], 'position', 'asc');
    const newCore = {
      ...core,
      objectives: lodashSortedObjectives,
    };
    recalculateValues(newCore);
  }, [core])

  const [expanded, setExpanded] = useState(false);
  const handleExpansion = (event, newValue) => {
    if (event.target.nodeName === 'CANVAS') return;
    setExpanded(newValue);
  };

  const handleEvaluation = (objectives) => {
    const newCore = { ...dynamicCore };
    newCore.objectives = objectives;
    recalculateValues(newCore);
  };

  if (!dynamicCore) return <LinearProgress />

  return (
    <Accordion
      expanded={expanded}
      onChange={handleExpansion}
      sx={{ mb: 2 }}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary
        aria-controls="panel1d-content"
        id="panel1d-header"
        expandIcon={<ExpandMoreIcon />}
      >
        <Box my={2} mx={1} pr={{ sm: 2 }}>
          <CoreListItem core={dynamicCore} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
        <ObjectivesListWithEvaluation
          objectives={[...dynamicCore[objectives]]}
          student={student}
          onEvaluation={handleEvaluation}
        />
        <Stack alignItems="flex-end">
          <StudentEvaluationsHistory student={student} core={dynamicCore} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
};