import React, { useContext } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import { toAcronym } from '../../helpers/strings';
import { AdvancedReportContext } from 'src/context/AdvancedReportContext';

export default function TimePeriodsHeader({ printing, timePeriodsToShow }) {
  const {
    activeTimePeriods,
  } = useContext(AdvancedReportContext);

  return (
    <>
      {Object.values(activeTimePeriods).map((timePeriod) => (
        <th key={timePeriod.name}>
          <Stack alignItems="center">
            <Typography
              variant="body2"
              textAlign="center"
              fontWeight="bold"
              display={printing ? 'flex' : { sm: 'none' }}
            >
              {toAcronym(timePeriod.name)}
            </Typography>
            <Typography
              variant="caption"
              textAlign="center"
              fontWeight="bold"
              display={printing ? 'none' : 'flex'}
            >
              {timePeriod.name}
            </Typography>
          </Stack>
        </th>
      ))}
    </>
  )
};