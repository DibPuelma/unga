import React, { useMemo, useState } from 'react';
import { Grid, InputAdornment, Stack, TextField, useMediaQuery } from '@mui/material';

import StudentListItem from './StudentListItem';
import { ascendingSort } from '../../helpers/arrays';
import UngaSelectSortMenu from '../utils/UngaSelectSortMenu';
import { SearchOutlined } from '@mui/icons-material';

const OPTIONS = [
  { id: 'firstName', label: 'Nombre' },
  { id: 'lastName', label: 'Apellido' },
  { id: 'birthDate', label: 'Nacimiento' },
  { id: 'rut', label: 'Rut' },
]

export default function StudentsList({ students }) {
  const [orderBy, setOrderBy] = useState('lastName');
  const [order, setOrder] = useState('asc');
  const [searchText, setSearchText] = useState('');
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const orderedStudents = useMemo(() => {
    const filteredStudents = students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(searchText.toLowerCase());
    });
    return (
      order === 'asc' ? ascendingSort(filteredStudents, orderBy) : ascendingSort(filteredStudents, orderBy).reverse()
    )
  }, [students, orderBy, order, searchText]);

  return (
    <Stack alignItems="flex-end" spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} width="100%">
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
          }}
          value={searchText}
          onChange={({ target: { value } }) => setSearchText(value)}
        />
        <UngaSelectSortMenu
          options={OPTIONS}
          onChangeOrderBy={setOrderBy}
          onChangeOrder={setOrder}
          order={order}
          orderBy={orderBy}
          fullWidth={!smUp}
        />
      </Stack>
      <Grid container spacing={{ sm: 2 }} columns={{ xs: 1, sm: 3 }}>
        {orderedStudents.map((student) => (
          <Grid key={student.id} item xs={1}>
            <StudentListItem key={student.id} student={student} paper={smUp} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}