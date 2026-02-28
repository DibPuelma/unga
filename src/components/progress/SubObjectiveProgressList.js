import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ProgressBars from './ProgressBars';

export default function SubObjectiveProgressList({ objectiveId, classroomId }) {
  const [subObjectives, setSubObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubObjectives = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/classrooms/${classroomId}/progress?objectiveId=${objectiveId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sub-objectives');
        }
        const data = await response.json();
        setSubObjectives(data.subObjectives || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (objectiveId) {
      fetchSubObjectives();
    }
  }, [objectiveId, classroomId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // On error, show empty array (will show nothing)
  const displaySubObjectives = error ? [] : (subObjectives || []);

  if (displaySubObjectives.length === 0 && !loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay sub-objetivos disponibles para este objetivo.
      </Typography>
    );
  }

  return (
    <List>
      {displaySubObjectives.map((subObjective) => {
        const hasNoPlanned = subObjective.plannedCount === 0;
        const hasNoEvaluated = subObjective.evaluatedCount === 0 && subObjective.plannedCount > 0;
        return (
          <ListItem
            key={subObjective.subObjectiveId}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              py: 1.5,
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
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                {(hasNoPlanned || hasNoEvaluated) && (
                  <WarningIcon sx={{ 
                    color: hasNoPlanned ? 'error.main' : 'warning.main', 
                    fontSize: 18 
                  }} />
                )}
                <Typography variant="body2">
                  {subObjective.subObjectiveName}
                </Typography>
              </Box>
              <ProgressBars
                plannedCount={subObjective.plannedCount}
                evaluatedCount={subObjective.evaluatedCount}
                compact={true}
              />
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}

