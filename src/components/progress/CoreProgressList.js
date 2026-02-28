import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import ObjectiveProgressList from './ObjectiveProgressList';
import ProgressBars from './ProgressBars';

export default function CoreProgressList({ cores, classroomId }) {
  const [expandedCore, setExpandedCore] = useState(null);

  const handleCoreExpansion = (coreId) => (event, isExpanded) => {
    setExpandedCore(isExpanded ? coreId : null);
  };

  // Always show cores, even if empty (they'll show 0 values)
  const displayCores = cores || [];

  if (displayCores.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay núcleos configurados para esta institución.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {displayCores.map((core) => {
        const hasNoPlanned = core.plannedCount === 0;
        const hasNoEvaluated = core.evaluatedCount === 0 && core.plannedCount > 0;
        return (
          <Accordion
            key={core.coreId}
            expanded={expandedCore === core.coreId}
            onChange={handleCoreExpansion(core.coreId)}
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
                  <Typography variant="h6" sx={{ minWidth: 0 }}>{core.coreName}</Typography>
                </Box>
                <ProgressBars
                  plannedCount={core.plannedCount}
                  evaluatedCount={core.evaluatedCount}
                  compact={true}
                />
              </Box>
            </AccordionSummary>
          <AccordionDetails>
            <ObjectiveProgressList
              coreId={core.coreId}
              classroomId={classroomId}
            />
          </AccordionDetails>
        </Accordion>
        );
      })}
    </Stack>
  );
}

