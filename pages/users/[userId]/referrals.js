import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { getUserReferrals, statusToSpanish } from "db/referral";
import moment from "moment-timezone";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { useContext, useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import Link from "src/Link";
import { UserContext } from "src/context/UserContext";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user } = await getServerSession(context.req, context.res, authOptions);
  const referrals = await getUserReferrals(user.id)

  return {
    props: serializeForNextProps({
      userEmail: user.email,
      referrals,
    })
  }

}
export default function UserReferrals({ userEmail, referrals }) {
  const { user } = useContext(UserContext);
  const [copiedText, setCopiedText] = useState(false);
  const columns = useMemo(() => [
    { headerName: 'Nombre completo', field: 'fullName', width: 250 },
    { headerName: 'Correo', field: 'email', width: 220 },
    { headerName: 'Día que se registró', field: 'createdAt', width: 200 },
    { headerName: 'Estado', field: 'status', width: 180 },
    { headerName: 'Monto a pagar', field: 'amountToPay', width: 150 },
    { headerName: 'Monto pagado', field: 'amountPaid', width: 150 },
  ], []);
  const rows = useMemo(() => referrals.map(referral => ({
    id: referral.id,
    fullName: `${referral.referred.firstName} ${referral.referred.lastName}`,
    email: referral.referred.email,
    createdAt: moment(referral.createdAt).format('DD [de] MMMM [de] YYYY'),
    status: statusToSpanish[referral.status],
    amountToPay: referral.amountToPay,
    amountPaid: referral.amountPaid,
  })), [referrals])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${location.origin}/auth/register?referrer=${userEmail}`);
    setCopiedText(true);
  }

  return (
    <>
      <Head><title>Educadoras referidas</title></Head>
      <Stack mt={4} alignItems="center">
        <Typography variant="h4" textAlign="center" gutterBottom>Invita colegas y gana</Typography>
        <Typography variant="h6" textAlign="center" mb={4}>Te pagamos $5.000 por cada persona que invites y pague alguno de nuestros planes</Typography>
        <Typography textAlign="center">Para invitar personas, solo debes compartirles este link</Typography>
        <Typography variant="h5" textAlign="center" gutterBottom>{location.origin}/auth/register?referrer={userEmail}</Typography>
        <Button variant="contained" onClick={handleCopyLink}>Copiar link</Button>
        {copiedText && (
          <Typography mt={0.5} textAlign="center" sx={(theme) => ({ color: theme.palette.success.main })}>¡Link copiado!</Typography>
        )}
      </Stack>
      <Stack mt={8} alignItems="center">
        <Typography variant="h6" textAlign="center" gutterBottom>Educadoras que has invitado</Typography>
        {referrals.length > 0 ? (
          <Stack width="100%">
            <DataGrid
              autoHeight
              getRowHeight={() => 'auto'}
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
            <Stack mt={2} alignItems="center">
              <Link
                noLinkStyle
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/447543814676?text=Hola, quiero solicitar mi plata por invitar a otras educadoras. Me correo es ${userEmail}.`}
              >
                <Button variant="contained">Solicitar que me paguen</Button>
              </Link>
            </Stack>
          </Stack>
        ) : (
          <Typography textAlign="center">
            Cuando invites a otras educadoras, aquí te mostraremos quiénes son y cuánta plata has ganado
          </Typography>
        )}
      </Stack>
    </>
  )
}