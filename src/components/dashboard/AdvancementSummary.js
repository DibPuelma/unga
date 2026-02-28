import { Check, InsertCommentOutlined, KeyboardArrowUp } from '@mui/icons-material';
import { Box, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import LevelOfAchievementDistribution from '../charts/LevelOfAchievementDistribution';

export default function AdvancementSummary({
  name,
  achievementDistribution,
  progress,
  performance,
  observations,
}) {
  const IconsContainer = () => (
    <Stack direction="row" justifyContent={{ sm: 'space-between' }} spacing={2}>
      <Stack direction="row" alignItems="center">
        <Check color="primary" sx={{ width: { xs: 14, sm: 16 }, height: { xs: 14, sm: 16 } }} />
        <Typography variant="caption" fontSize={{ xs: 10, sm: 'inherit' }}>{(progress * 100).toFixed(0)}%</Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <KeyboardArrowUp color="primary" sx={{ width: { xs: 14, sm: 16 }, height: { xs: 14, sm: 16 } }} />
        <Typography variant="caption" fontSize={{ xs: 10, sm: 'inherit' }}>{(performance * 100).toFixed(0)}%</Typography>
      </Stack>
      {/* Must be compared with null, because if it is 0, we want to show it */}
      {observations !== null && (
        <Stack direction="row" alignItems="center">
          <InsertCommentOutlined color="primary" sx={{ width: { xs: 12, sm: 14 }, height: { xs: 12, sm: 14 } }} />
          <Typography variant="caption" fontSize={{ xs: 10, sm: 'inherit' }} ml={0.5}>{observations || 0}</Typography>
        </Stack>
      )}
    </Stack>
  )
  return (
    <Grid container height="fit-content" spacing={1} py={1} columns={24}>
      <Grid item xs={24} sm={5}>
        <Stack direction="column">
          <Typography variant="body2">{name}</Typography>
          <Box display={{ sm: 'none' }}>
            <IconsContainer />
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={24} sm={13} md={14} height="3rem">
        <LevelOfAchievementDistribution
          levelsOfAchievementDistribution={achievementDistribution}
          noLegend
        />
      </Grid>
      <Grid item xs={10} sm={6} md={4} display={{ xs: 'none', sm: 'block' }}>
        <IconsContainer />
      </Grid>
    </Grid>
  )
}
