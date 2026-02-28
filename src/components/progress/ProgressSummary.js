import React from 'react';
import { Box, Card, CardContent, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ProgressSummary({
  plannedToDate,
  evaluatedToDate,
  expectedToDate,
  expectedFullYear,
}) {
  const theme = useTheme();

  const plannedPercentage = expectedToDate > 0 ? Math.min((plannedToDate / expectedToDate) * 100, 100) : 0;
  const evaluatedPercentage = expectedToDate > 0 ? Math.min((evaluatedToDate / expectedToDate) * 100, 100) : 0;
  const yearProgressPercentage = expectedFullYear > 0 ? Math.min((plannedToDate / expectedFullYear) * 100, 100) : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actividades planificadas
            </Typography>
            <Typography variant="h4" color="primary">
              {plannedToDate}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              de {expectedToDate} esperadas hasta la fecha
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={plannedPercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {plannedPercentage.toFixed(1)}% completado
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actividades evaluadas
            </Typography>
            <Typography variant="h4" color="success.main">
              {evaluatedToDate}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              de {expectedToDate} esperadas hasta la fecha
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={evaluatedPercentage}
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {evaluatedPercentage.toFixed(1)}% completado
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progreso anual
            </Typography>
            <Typography variant="h4" color="info.main">
              {plannedToDate}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              de {expectedFullYear} esperadas para el año
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={yearProgressPercentage}
                color="info"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {yearProgressPercentage.toFixed(1)}% del año
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}




