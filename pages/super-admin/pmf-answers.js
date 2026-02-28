import { Paper, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getLastMonthPmfAnswers } from 'db/pmfAnswer';
import moment from 'moment-timezone';
import { useMemo } from 'react';
import { isAuthorized } from 'services/Authorization';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const pmfAnswers = await getLastMonthPmfAnswers();

  return {
    props: {
      pmfAnswers
    }
  }
}

export default function pmfAnswers({ pmfAnswers }) {
  const columns = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'snoozeCount', headerName: 'Postergado', width: 50, type: 'number'},
    { field: 'createdAt', headerName: 'Fecha creación', width: 160 },
    { field: 'answeredAt', headerName: 'Fecha respuesta', width: 160 },
    { field: 'firstName', headerName: 'Nombres', width: 150 },
    { field: 'lastName', headerName: 'Apellidos', width: 150 },
    { field: 'plan', headerName: 'Plan', width: 120 },
    { field: 'institutionName', headerName: 'Institución', width: 200 },
    { field: 'phoneNumber', headerName: 'Teléfono', width: 150 },
    { field: 'email', headerName: 'Email', width: 150 },
    { field: 'dissapointment', headerName: 'Decepción', width: 160 },
    { field: 'why', headerName: 'Por qué', width: 500 },
    { field: 'improvements', headerName: 'Mejoras', width: 500 },
  ], []);
  
  const rows = useMemo(() => pmfAnswers.map((answer) => {
    const {
      dissapointment,
      why,
      improvements,
      snoozeCount,
      user: { firstName, lastName, phoneNumber, email, plan },
      institution,
      createdAt,
      answeredAt,
    } = answer;
    const institutionName = institution?.name;
    return {
      id: answer.id,
      dissapointment,
      why,
      improvements,
      snoozeCount,
      firstName,
      lastName,
      phoneNumber,
      email,
      plan,
      institutionName,
      createdAt: moment(createdAt).format('YYYY-MM-DD HH:mm'),
      answeredAt: answeredAt && moment(answeredAt).format('YYYY-MM-DD HH:mm'),
    }
  }), [pmfAnswers])

  const dissapointment = useMemo(() => {
    const values = {
      veryDissapointed: 0,
      somewhatDissapointed: 0,
      notDissapointed: 0,
      total: 0,
    }
    pmfAnswers.forEach((answer) => {
      const { dissapointment } = answer;
      values[dissapointment] += 1;
      if (dissapointment) values.total += 1;
    });

    return values
  }, [pmfAnswers])

  return (
    <Stack>
      <Typography variant="h4" sx={{ mb: 2 }}>Respuestas PMF último mes</Typography>
      <Stack direction="row" mb={4} spacing={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h4">{parseInt(dissapointment.veryDissapointed / dissapointment.total * 100, 10)}%</Typography>
          <Typography>Muy decepcionada ({dissapointment.veryDissapointed} / {dissapointment.total}) </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h4">{parseInt(dissapointment.somewhatDissapointed / dissapointment.total * 100, 10)}%</Typography>
          <Typography>Algo decepcionada ({dissapointment.somewhatDissapointed} / {dissapointment.total}) </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h4">{parseInt(dissapointment.notDissapointed / dissapointment.total * 100, 10)}%</Typography>
          <Typography>No decepcionada ({dissapointment.notDissapointed} / {dissapointment.total}) </Typography>
        </Paper>
      </Stack>
      <DataGrid
        autoHeight
        getRowHeight={() => 'auto'}
        rows={rows}
        columns={columns}
        pageSize={100}
        rowsPerPageOptions={[100]}
      />
    </Stack>
  );
}