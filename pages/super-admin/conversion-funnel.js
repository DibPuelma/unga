import { CircularProgress, MenuItem, OutlinedInput, Paper, Select, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { getAllUsers } from "db/user";
import moment from "moment-timezone";
import { useEffect, useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import PlansService from "services/PlansService";

const keyToLabel = {
  registeredUsers: 'Registrados',
  freeUsers: 'Gratis (sin suscripción)',
  payingUsers: 'Suscritos',
  canceledUsers: 'Cancelados',
};

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const users = await getAllUsers();
  const B2CUsers = users.filter((user) => PlansService.B2C_PLANS.includes(user.plan) && user.createdAt);
  return {
    props: {
      users: B2CUsers,
    }
  }
}

export default function ConversionFunnel({ users }) {
  const [fromYear, setFromYear] = useState(moment().year());
  const [fromMonth, setFromMonth] = useState(moment().month() + 1);
  const [toYear, setToYear] = useState(moment().year());
  const [toMonth, setToMonth] = useState(moment().month() + 2);
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fromDate = useMemo(() => `${fromYear}-${fromMonth}-01`, [fromYear, fromMonth]);
  const toDate = useMemo(() => `${toYear}-${toMonth}-01`, [toYear, toMonth]);

  useEffect(() => {
    const usersConsideringDate = users.filter(
      (user) => moment(user.createdAt).isSameOrAfter(fromDate) && moment(user.createdAt).isBefore(toDate)
    )
    const usersData = {
      registeredUsers: usersConsideringDate,
      freeUsers: usersConsideringDate.filter((user) => user.plan === 'free' && !Boolean(user.planCanceledAt)),
      payingUsers: usersConsideringDate.filter((user) => user.plan === 'unga'),
      canceledUsers: usersConsideringDate.filter((user) => Boolean(user.planCanceledAt)),
    };

    setUsersData(usersData);
    setLoading(false);
  }, [fromDate, toDate])

  const getType = (user) => {
    if (user.plan === 'unga') return 'payingUsers';
    if (Boolean(user.planCanceledAt)) return 'canceledUsers';
    if (user.plan === 'free') return 'freeUsers';
  }


  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h6">Creación desde</Typography>
        <Select
          value={fromYear}
          onChange={(event) => setFromYear(event.target.value)}
          input={<OutlinedInput label="Año" />}
        >
          {Array.from({ length: moment().year() - 2019 + 1 }, (_, index) => 2019 + index).map((year) => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </Select>
        <Select
          value={fromMonth}
          onChange={(event) => setFromMonth(event.target.value)}
          input={<OutlinedInput label="Mes" />}
        >
          {moment.months().map((month, index) => (
            <MenuItem key={month} value={index + 1}>{month}</MenuItem>
          ))}
        </Select>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h6">Creación hasta</Typography>
        <Select
          value={toYear}
          onChange={(event) => setToYear(event.target.value)}
          input={<OutlinedInput label="Año" />}
        >
          {Array.from({ length: moment().year() - 2019 + 1 }, (_, index) => 2019 + index).map((year) => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </Select>
        <Select
          value={toMonth}
          onChange={(event) => setToMonth(event.target.value)}
          input={<OutlinedInput label="Mes" />}
        >
          {moment.months().map((month, index) => (
            <MenuItem key={month} value={index + 1}>{month}</MenuItem>
          ))}
        </Select>
      </Stack>
      {loading ? (
        <Stack alignItems="center">
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4}>
            {Object.entries(usersData).map(([key, value]) => (
              <Paper key={key} sx={{ p: 2, width: { xs: '100%', sm: '20%' } }}>
                <Typography variant="h6">{keyToLabel[key]}</Typography>
                <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="baseline">
                  <Typography variant="h3" textAlign="right">{value.length}</Typography>
                  <Typography variant="h6" textAlign="right">
                    ({(value.length / usersData.registeredUsers.length * 100).toFixed(1)}%)
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
          <DataGrid
            autoHeight
            getRowHeight={() => 'auto'}
            rows={usersData.registeredUsers.map((user) => ({
              id: user.id,
              createdAt: moment(user.createdAt).format('DD MMMM YYYY'),
              fullName: `${user.firstName} ${user.lastName}`,
              email: user.email,
              whatsapp: `https://wa.me/${user.phoneNumber?.slice(1)}`,
              plan: user.plan,
              type: getType(user),
              trialEndsAt: user.trialEndsAt ? moment(user.trialEndsAt).format('DD MMMM YYYY') : null,
              reference: user.reference,
            }))}
            columns={[
              { field: 'id', headerName: 'ID', flex: 1 },
              { field: 'createdAt', headerName: 'Fecha de creación', flex: 2 },
              { field: 'fullName', headerName: 'Nombre', flex: 4 },
              { field: 'email', headerName: 'Email', flex: 4 },
              { field: 'whatsapp', headerName: 'Whatsapp link', flex: 4 },
              { field: 'plan', headerName: 'Plan', flex: 2 },
              { field: 'type', headerName: 'Tipo', flex: 2 },
              { field: 'trialEndsAt', headerName: 'Fin del trial', flex: 2 },
              { field: 'reference', headerName: 'Referencia', flex: 2 }
            ]}
            pageSize={50}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
          />
        </>
      )}
    </>
  )
}