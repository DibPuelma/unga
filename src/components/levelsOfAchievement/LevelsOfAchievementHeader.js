import React, { useContext } from 'react';
import { Grid, Typography } from '@mui/material';
import { toAcronym } from '../../helpers/strings';
import { UserContext } from '../../context/UserContext';

export default function LevelsOfAchievementHeader() {
  const { levelsOfAchievement } = useContext(UserContext);

  return (
    <Grid container columns={levelsOfAchievement.length}>
      {levelsOfAchievement.map((level) => (
        <React.Fragment key={level.id}>
          <Grid item xs={1} sx={{ display: { md: 'none' } }}>
            <Typography variant="body2" textAlign="center">
              {toAcronym(level.name)}
            </Typography>
          </Grid>
          <Grid
            item
            xs={1}
            display={{ xs: 'none', md: 'flex' }}
            alignItems="end"
            justifyContent="center"
          >
            <Typography variant="caption" textAlign="center">
              {level.name}
            </Typography>
          </Grid>
        </React.Fragment>
      ))}
    </Grid>
  )
};