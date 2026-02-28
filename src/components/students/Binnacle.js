import React, { useEffect, useMemo, useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import moment from 'moment-timezone';

import ObservationInBinnacle from '../observations/ObservationInBinnacle';
import { Timeline } from '@mui/lab';

export default function Binnacle({ observations }) {
  // const [observationsByDate, setObservationsByDate] = useState(null);
  // const [months, setMonths] = useState([]);
  // const [years, setYears] = useState([]);
  // useEffect(() => {
  //   const newObservationsByDate = {};
  //   const newMonths = new Set();
  //   const newYears = new Set();
  //   observations.forEach((observation) => {
  //     const observationDate = observation.observedAt || observation.createdAt;
  //     const observationMomentDate = moment(observationDate);
  //     const month = observationMomentDate.format('MMMM');
  //     const year = observationMomentDate.format('YYYY');
  //     newObservationsByDate[`${year}.${month}`] = observation;
  //     newMonths.push(month);
  //     newYears.add(year);
  //   })
  //   setObservationsByDate(newObservationsByDate);
  //   setMonths([...newMonths]);
  //   setYears([...newYears]);
  // }, [observations])

  // if (!observationsByDate) return <LinearProgress />;
  if (observations.length <= 0) {
    return (
      <Typography textAlign="center">La bitácora aún está vacía</Typography>
    )
  }
  return (
    <Timeline position="right">
      {observations.map((observation) => (
        <ObservationInBinnacle key={observation.id} observation={observation} />
      ))}
    </Timeline>
  );
};