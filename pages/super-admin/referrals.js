import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { getAllReferrals, statusToSpanish } from "db/referral";
import moment from "moment-timezone";
import Head from "next/head";
import { useContext, useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import { UserContext } from "src/context/UserContext";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;
  const referrals = await getAllReferrals();

  return {
    props: {
      referrals,
    }
  }

}
export default function AllReferrals({ referrals }) {
  const columns = useMemo(() => [
    { headerName: 'ID referidora', field: 'referrerId', width: 10 },
    { headerName: 'Nombre referidora', field: 'referrerFullName', width: 200 },
    { headerName: 'Correo referidora', field: 'referrerEmail', width: 190 },
    { headerName: 'ID referida', field: 'referredId', width: 10 },
    { headerName: 'Nombre referida', field: 'referredFullName', width: 200 },
    { headerName: 'Correo referida', field: 'referredEmail', width: 190 },
    { headerName: 'Día que se registró', field: 'referredCreatedAt', width: 180 },
    { headerName: 'Estado', field: 'status', width: 180 },
    { headerName: 'Monto esperado', field: 'amountToPay', width: 150 },
    { headerName: 'Monto pagado', field: 'amountPaid', width: 150 },
  ], []);
  const rows = useMemo(() => referrals.map(referral => ({
    id: referral.id,
    referrerId: referral.referrer.id,
    referrerFullName: `${referral.referrer.firstName} ${referral.referrer.lastName}`,
    referrerEmail: referral.referrer.email,
    referredId: referral.referred.id,
    referredFullName: `${referral.referred.firstName} ${referral.referred.lastName}`,
    referredEmail: referral.referred.email,
    referredCreatedAt: moment(referral.createdAt).format('DD [de] MMMM [de] YYYY'),
    status: statusToSpanish[referral.status],
    amountToPay: referral.amountToPay,
    amountPaid: referral.amountPaid,
  })), [referrals])

  const [totalPaidAmount, totalOwedAmount] = useMemo(() => {
    const totalPaidAmount = referrals.reduce((acc, referral) => acc + referral.amountPaid, 0);
    const totalOwedAmount = referrals.reduce((acc, referral) => acc + referral.amountToPay, 0);
    return [totalPaidAmount, totalOwedAmount];
  }, [referrals])


  return (
    <>
      <Head><title>Todos los referidos</title></Head>
      <Stack mt={4} alignItems="center">
        <Typography variant="h4" sx={{ mb: 2 }}>Referidos totales</Typography>
        <Stack direction="row" mb={4} spacing={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h4">${totalOwedAmount}</Typography>
            <Typography>Monto total adeudado</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h4">${totalPaidAmount}</Typography>
            <Typography>Monto total pagado</Typography>
          </Paper>
        </Stack>
        <Stack width="100%">
          <DataGrid
            autoHeight
            getRowHeight={() => 'auto'}
            rows={rows}
            columns={columns}
            pageSize={100}
            rowsPerPageOptions={[100]}
          />
        </Stack>
      </Stack>
    </>
  )
}