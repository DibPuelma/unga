import React, { useMemo } from 'react';
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import Link from '../../Link';

export default function CoreCard({
  core: {
    id,
    name,
    advancement,
    totalEvaluations,
    possibleEvaluations,
  }
}) {
  const router = useRouter();
  const { asPath } = router;
  const [pathWithoutParams, params] = useMemo(() => {
    const [pathWithoutParams, ...params] = asPath.split('?');
    return [pathWithoutParams, params];
  }, [asPath]);
  const evaluationsRatio = totalEvaluations / possibleEvaluations * 100;

  return (
    <Grid item xs={12} md={6}>
      <style type="text/css" media="print">
        {`
          .objectives-button {
            display: none;
          }
        `}
      </style>
      <Link href={`${pathWithoutParams}/${id}?${params}`} underline="none" color="inherit">
        <Paper elevation={4} sx={{ px: 2, py: 1, height: '100%' }} >
          <Stack>
            <Typography fontWeight={500} mb={1}>
              {name}
            </Typography>
            <Stack rowGap={1} mb={1}>
              <Grid container columnGap={1} alignItems="center">
                <Grid item xs={4} sm={3} md={3}>
                  <Typography>
                    Desempeño
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={7} md={7}>
                  <LinearProgress sx={{ height: 20, width: '100%' }} variant="determinate" value={advancement} />
                </Grid>
                <Grid item xs={1}>
                  <Typography>
                    {advancement.toFixed(0)}%
                  </Typography>
                </Grid>
              </Grid>
              <Grid container columnGap={1} alignItems="center">
                <Grid item xs={4} sm={3} md={3}>
                  <Typography>
                    Evaluaciones
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={7} md={7}>
                  <LinearProgress color="secondary" sx={{ height: 20, width: '100%' }} variant="determinate" value={evaluationsRatio} />
                </Grid>
                <Grid item xs={1}>
                  <Typography>
                    {totalEvaluations}/{possibleEvaluations}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
            <Stack alignItems="flex-end" className="objectives-button">
              <Button variant="text">Ver indicadores</Button>
            </Stack>
          </Stack>
        </Paper>
      </Link>
    </Grid >
  )
};
