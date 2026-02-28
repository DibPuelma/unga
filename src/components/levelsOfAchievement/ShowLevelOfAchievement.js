import React, { useContext } from 'react';
import { Grid } from '@mui/material';

import { UserContext } from '../../context/UserContext';
import { CircleOutlined, RadioButtonChecked } from '@mui/icons-material';

export default function ShowLevelOfAchievement({
  currentValue,
  fontSize,
}) {
  const { levelsOfAchievement } = useContext(UserContext);

  return (
    <Grid container columns={levelsOfAchievement.length} direction="row">
      {levelsOfAchievement.map((level) => (
        <Grid item xs={1} display="flex" justifyContent="center" key={level.id}>
          {currentValue === level.id ? (
            <RadioButtonChecked sx={(theme) => ({ fontSize, color: theme.palette.grey[600] })} />
          ) : (
            <CircleOutlined sx={(theme) => ({ fontSize, color: theme.palette.grey[600] })} />
          )}
        </Grid>
      ))}
    </Grid>
  )
}