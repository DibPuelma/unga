import React, { useContext } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import Link from 'src/Link';
import { UserContext } from 'src/context/UserContext';
import { MONTHLY_CREDITS } from 'src/helpers/plans';

// Read-only landing after the Transbank flow; all state changes already
// happened server-side in the callback.
const RESULTS = {
  subscribed: {
    icon: <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />,
    title: '¡Bienvenida a Unga! 🎉',
    text: `Tu suscripción está activa y ya tienes ${MONTHLY_CREDITS} créditos para crear experiencias con IA.`,
    cta: 'Crear mi primera experiencia',
  },
  card_registered: {
    icon: <CreditCardIcon color="primary" sx={{ fontSize: 64 }} />,
    title: 'Tarjeta registrada',
    text: 'Tu tarjeta quedó registrada correctamente.',
    cta: 'Volver a Unga',
  },
  charge_rejected: {
    icon: <ErrorOutlineIcon color="warning" sx={{ fontSize: 64 }} />,
    title: 'Tu tarjeta quedó registrada, pero el cobro fue rechazado',
    text: 'Tu banco rechazó el primer cobro. Inténtalo de nuevo desde tu página de plan o usa otra tarjeta.',
    cta: 'Ir a mi plan',
  },
  rejected: {
    icon: <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />,
    title: 'No pudimos registrar tu tarjeta',
    text: 'El registro fue rechazado. Inténtalo de nuevo o usa otra tarjeta.',
    cta: 'Volver a intentar',
  },
  aborted: {
    icon: <ErrorOutlineIcon color="warning" sx={{ fontSize: 64 }} />,
    title: 'Registro cancelado',
    text: 'Cancelaste el registro de tu tarjeta. Puedes intentarlo cuando quieras.',
    cta: 'Volver a mi plan',
  },
  error: {
    icon: <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />,
    title: 'Algo salió mal',
    text: 'Ocurrió un error procesando tu suscripción. Si el problema persiste, contáctanos por WhatsApp.',
    cta: 'Volver a mi plan',
  },
};

export default function SubscriptionResult() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const status = RESULTS[router.query.status] ? router.query.status : 'error';
  const result = RESULTS[status];

  const ctaHref = status === 'subscribed' && user?.institution?.id
    ? `/institutions/${user.institution.id}/activities/create`
    : user?.id ? `/users/${user.id}/current-plan` : '/';

  return (
    <>
      <Head><title>Suscripción</title></Head>
      <Box maxWidth={480} mx="auto" mt={8} px={2}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            {result.icon}
            <Typography variant="h5" fontWeight={700}>{result.title}</Typography>
            <Typography color="text.secondary">{result.text}</Typography>
            <Button component={Link} href={ctaHref} variant="contained" size="large">
              {result.cta}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
