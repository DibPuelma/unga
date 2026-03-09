import React from 'react';
import { useRouter } from 'next/router';
import { ArrowForwardIos, Event, Fingerprint } from '@mui/icons-material';
import { Box, Button, Divider, Grid, Paper, Stack, Typography } from '@mui/material';

import Link from '../../Link';
import moment from 'moment-timezone';
import Avatar from '../user/Avatar';
import StudentAvatar from './Avatar';

export default function StudentListItem({ student, paper }) {
  const { query: { classroomId } } = useRouter();

  const ItemData = () => (

    <Stack direction="row" alignItems="center">
      <StudentAvatar student={student} />
      <Link
        href={`/classes/${classroomId}/students/${student.id}`}
        underline="none"
        color="inherit"
        sx={{ width: '100%' }}
      >
        <Stack
          direction="row"
          py={{ xs: 2, sm: 1 }}
          px={1}
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack>
            <Typography>{student.firstName} {student.lastName}</Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Event fontSize='10px' />
              <Typography variant="caption">{
                student.birthDate ?
                  moment.utc(student.birthDate).format('DD [de] MMM [de] YYYY') :
                  'Sin fecha de nacimiento'
              }
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Fingerprint fontSize='10px' />
              <Typography variant="caption">{student.rut ? student.rut : 'Sin rut'}</Typography>
            </Stack>
          </Stack>
          <ArrowForwardIos color="primary" />
        </Stack>
      </Link>
    </Stack >
  )
  if (paper) {
    return (
      <Grid item xs={4} md={3}>
        <Paper elevation={4} sx={{ height: '100%', px: 1 }}>
          <ItemData />
        </Paper>
      </Grid>
    )
  }
  return (
    <Box width="100%">
      <ItemData />
      <Divider />
    </Box>
  );
}