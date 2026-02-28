import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

export default function ProgressBars({ plannedCount, evaluatedCount, maxValue = null, compact = false }) {
  // Calculate the ratio of evaluated to planned (percentage of planned that has been evaluated)
  const ratioPercentage = plannedCount > 0 
    ? Math.min((evaluatedCount / plannedCount) * 100, 100) 
    : 0;

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', minWidth: { xs: 140, sm: 180 }, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            Evaluadas:
          </Typography>
          <Typography variant="caption" fontWeight="medium" color="success.main" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            {evaluatedCount}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 60 }}>
          <LinearProgress
            variant="determinate"
            value={ratioPercentage}
            color="success"
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            Planificadas:
          </Typography>
          <Typography variant="caption" fontWeight="medium" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            {plannedCount}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Evaluadas:
          </Typography>
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {evaluatedCount}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Planificadas:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {plannedCount}
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={ratioPercentage}
        color="success"
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

