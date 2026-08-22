import React, { useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter } from 'next/router';
import { UserContext } from 'src/context/UserContext';
import { SUBSCRIPTION_PRICE_CLP, MONTHLY_CREDITS, SIGNUP_CREDITS, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_CLP } from 'src/helpers/plans';

const formatCLP = (n) => `$${n.toLocaleString('es-CL')}`;

// variant 'trial': free user spent the signup credits → sell the subscription.
// variant 'monthly': subscriber ran out this month → sell extra packs.
export default function PaywallDialog({ open, onClose, variant = 'trial' }) {
  const router = useRouter();
  const { user } = useContext(UserContext);

  const goToPlan = () => {
    onClose();
    router.push(`/users/${user.id}/current-plan`);
  };

  const isTrial = variant === 'trial';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        {isTrial ? `Creaste tus ${SIGNUP_CREDITS} experiencias gratis 🎉` : 'Usaste todos tus créditos del mes'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <AutoAwesomeIcon color="primary" fontSize="large" />
          {isTrial ? (
            <>
              <Typography>
                Suscríbete por <b>{formatCLP(SUBSCRIPTION_PRICE_CLP)}/mes</b> y crea hasta{' '}
                <b>{MONTHLY_CREDITS} experiencias al mes</b> con IA, con planificación semanal y descarga en PDF.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Se cobra el 1° de cada mes. El primer mes pagas solo los días que queden. Cancela cuando quieras.
              </Typography>
            </>
          ) : (
            <>
              <Typography>
                Compra <b>{CREDIT_PACK_SIZE} créditos extra por {formatCLP(CREDIT_PACK_PRICE_CLP)}</b> y crea{' '}
                <b>{CREDIT_PACK_SIZE} experiencias más</b> hoy mismo.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tus {MONTHLY_CREDITS} créditos mensuales se renuevan el 1° del próximo mes. Los créditos extra no vencen.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
        <Button variant="contained" fullWidth size="large" onClick={goToPlan}>
          {isTrial ? 'Suscribirme' : 'Comprar créditos extra'}
        </Button>
        <Button fullWidth onClick={onClose} color="inherit">
          Ahora no
        </Button>
      </DialogActions>
    </Dialog>
  );
}
