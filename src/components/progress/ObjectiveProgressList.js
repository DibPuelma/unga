import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import SubObjectiveProgressList from './SubObjectiveProgressList';
import ProgressBars from './ProgressBars';

export default function ObjectiveProgressList({ coreId, classroomId }) {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedObjective, setExpandedObjective] = useState(null);

  useEffect(() => {
    const fetchObjectives = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/classrooms/${classroomId}/progress?coreId=${coreId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch objectives');
        }
        const data = await response.json();
        setObjectives(data.objectives || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (coreId) {
      fetchObjectives();
    }
  }, [coreId, classroomId]);

  const handleObjectiveExpansion = (objectiveId) => (event, isExpanded) => {
    setExpandedObjective(isExpanded ? objectiveId : null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // On error, show empty array (will show nothing)
  const displayObjectives = error ? [] : (objectives || []);

  if (displayObjectives.length === 0 && !loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay objetivos disponibles para este núcleo.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {displayObjectives.map((objective) => {
        const hasNoPlanned = objective.plannedCount === 0;
        const hasNoEvaluated = objective.evaluatedCount === 0 && objective.plannedCount > 0;
        return (
          <Accordion
            key={objective.objectiveId}
            expanded={expandedObjective === objective.objectiveId}
            onChange={handleObjectiveExpansion(objective.objectiveId)}
            TransitionProps={{ unmountOnExit: true }}
            sx={{
              ...(hasNoPlanned && {
                backgroundColor: 'rgba(255, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.08)',
                },
              }),
              ...(hasNoEvaluated && {
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 193, 7, 0.15)',
                },
              }),
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2, gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: { xs: '1 1 100%', sm: '0 1 auto' }, minWidth: 0 }}>
                  {(hasNoPlanned || hasNoEvaluated) && (
                    <WarningIcon sx={{ 
                      color: hasNoPlanned ? 'error.main' : 'warning.main', 
                      fontSize: { xs: 18, sm: 20 } 
                    }} />
                  )}
                  <Typography variant="body1" fontWeight="medium" sx={{ minWidth: 0 }}>
                    {objective.objectiveName}
                  </Typography>
                </Box>
                <ProgressBars
                  plannedCount={objective.plannedCount}
                  evaluatedCount={objective.evaluatedCount}
                  compact={true}
                />
              </Box>
            </AccordionSummary>
          <AccordionDetails>
            <SubObjectiveProgressList
              objectiveId={objective.objectiveId}
              classroomId={classroomId}
            />
          </AccordionDetails>
        </Accordion>
        );
      })}
    </Stack>
  );
}

