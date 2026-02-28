import React from 'react';
import {
  Box,
  Grid,
  Typography,
  useMediaQuery,
} from '@mui/material';
import AssetShowcase from '../assets/AssetShowcase';
import { isEmpty } from '../../helpers/objects';
import { getObservationDate } from './helpers';
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';

export default function ObservationInBinnacle({
  observation,
}) {
  const {
    id,
    data: {
      students,
      description,
      core,
      objective,
      levelOfAchievement,
      teacher,
      createdAt,
      observedAt,
      assets
    }
  } = observation;

  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'))

  return (
    <TimelineItem sx={{ p: 0 }}>
      <Grid container>
        <Grid item xs={0} sm={2} display={{ xs: 'none', md: 'flex' }}>
          <TimelineOppositeContent color="text.secondary" display={{ xs: 'none', md: 'block' }}>
            {getObservationDate(observedAt, createdAt)}
          </TimelineOppositeContent>
        </Grid>

          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector />
          </TimelineSeparator>

        <Grid item xs={11} sm={9}>
          <TimelineContent>
            <Box>
              <Typography display={{ md: 'none' }} variant="subtitle2">
                {getObservationDate(observedAt, createdAt)}
              </Typography>
              <Typography variant={smUp ? 'h6' : 'body2'}>{description}</Typography>
              {!isEmpty(assets) && (
                <Box mt={1}>
                  <AssetShowcase assets={assets} />
                </Box>
              )}
            </Box>
          </TimelineContent>
        </Grid>
      </Grid>
    </TimelineItem>

  )
}