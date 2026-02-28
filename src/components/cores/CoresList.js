import React, { useMemo } from 'react';
import {
  Grid,
} from '@mui/material';

import CoreListItem from './CoreListItem';
import { ascendingSort } from '../../helpers/arrays';
import CoreCard from './CoreCard';
import CoreReportCard from './CoreReportCard';

export default function CoresList({
  cores,
  smUp,
  report,
}) {
  const sortedCores = useMemo(() => ascendingSort(cores, 'position'), [cores])
  const ListItem = ({ core }) => {
    if (report) return (
      <CoreReportCard
        core={core}
      />
    )
    return (
      <CoreCard
        core={core}
      />
    )
  }
  return (
    <Grid container spacing={2}>
      {sortedCores.map((core) => <ListItem key={core.id} core={core} />)}
    </Grid>
  )
}