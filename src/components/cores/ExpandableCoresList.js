import React from 'react';
import {
  Box,
} from '@mui/material';

import ExpandableCoreListItem from './ExpandableCoreListItem';
import { ascendingSort } from '../../helpers/arrays';

export default function ExpandableCoresList({
  cores,
  student,
  objectives = 'objectives'
}) {
  return (
    <>
      {ascendingSort(cores, 'position').map((core) => (
        <ExpandableCoreListItem
          key={core.id}
          core={core}
          student={student}
          objectives={objectives}
        />
      ))}
    </>
  )
}