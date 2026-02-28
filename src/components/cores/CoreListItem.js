import React from 'react';
import { useRouter } from 'next/router';
import {
  Typography,
  Box,
  Grid,
  Divider,
  Stack,
  useMediaQuery,
} from '@mui/material';
import Link from '../../Link';
import { ArrowForwardIos } from '@mui/icons-material';

export default function CoreListItem({
  core: {
    id,
    name,
    advancement,
    possibleEvaluations,
    totalEvaluations,
    advancementText
  },
  withLink,
}) {
  const smDown = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { asPath } = useRouter();

  const ItemData = ({ withLink }) => (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack>
        <Typography variant="h4">
          {`${advancement.toFixed(0)}%`}
        </Typography>
        <Typography variant={smDown ? 'subtitle2' : 'subtitle1'} fontWeight="bold">
          {name}
        </Typography>
        <Grid container>
          <Grid item xs={12}>
            <Typography variant="body2">
              ({totalEvaluations} de {possibleEvaluations} evaluaciones)
            </Typography>
          </Grid>
        </Grid>
      </Stack>
      {withLink &&
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
          <ArrowForwardIos sx={{ color: '#7A8593' }} />
        </Box>
      }
    </Stack>
  )

  if (!withLink) {
    return (
      <ItemData />
    );
  }

  return (
    <>
      <Link href={`${asPath}/${id}`} underline="none" color="inherit" sx={{ width: '100%' }}>
        <ItemData withLink />
      </Link>
      <Divider sx={{ width: '100%', my: 2 }} />
    </>
  );

};
