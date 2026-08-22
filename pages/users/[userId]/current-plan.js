import React, { useContext, useMemo, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import BoltIcon from '@mui/icons-material/Bolt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { UserContext } from 'src/context/UserContext';
import useCredits from 'src/hooks/useCredits';
import {
  SUBSCRIPTION_PRICE_CLP,
  MONTHLY_CREDITS,
  CREDIT_PACK_SIZE,
  CREDIT_PACK_PRICE_CLP,
  isB2CPlan,
} from 'src/helpers/plans';

const formatCLP = (n) => `$${n.toLocaleString('es-CL')}`;

// Transbank requires a POST redirect with the inscription token.
const postRedirect = (url, token) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'TBK_TOKEN';
  input.value = token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
};

export default function CurrentPlan() {
  const { user } = useContext(UserContext);
  const { credits, loading, refresh } = useCredits();
  const [subscribing, setSubscribing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [packs, setPacks] = useState(1);
  const [message, setMessage] = useState(null);

  const subscription = credits?.subscription;
  const isSubscribed = subscription && ['active', 'payment_failed'].includes(subscription.status);

  const packCredits = packs * CREDIT_PACK_SIZE;
  const packPrice = packs * CREDIT_PACK_PRICE_CLP;

  const planLabel = useMemo(() => {
    if (!user) return '';
    if (user.plan === 'unga') return 'Suscripción Unga';
    if (user.plan === 'institutional') return 'Plan institucional';
    return 'Plan gratuito';
  }, [user]);

  if (!user) return <LinearProgress />;

  if (!isB2CPlan(user.plan)) {
    return (
      <Box mt={4} maxWidth={560} mx="auto">
        <Head><title>Tu plan</title></Head>
        <Typography variant="h4" align="center" gutterBottom>{planLabel}</Typography>
        <Typography align="center" color="text.secondary">
          Tu acceso es gestionado por tu centro educativo.
        </Typography>
      </Box>
    );
  }

  const handleSubscribe = async () => {
    setSubscribing(true);
    setMessage(null);
    try {
      const { data } = await axios.post('/api/payments/cards/register', { intent: 'subscribe' });
      postRedirect(data.url, data.token);
    } catch (e) {
      setMessage({ severity: 'error', text: 'No pudimos iniciar el registro de tu tarjeta. Inténtalo de nuevo.' });
      setSubscribing(false);
    }
  };

  const handleBuyPacks = async () => {
    setBuying(true);
    setMessage(null);
    try {
      const { data } = await axios.post('/api/payments/credit-packs', { packs });
      setMessage({ severity: 'success', text: `¡Listo! Se agregaron ${data.creditsGranted} créditos extra.` });
      refresh();
    } catch (e) {
      const text = e.response?.data?.userMessage
        || 'No pudimos procesar el pago. Revisa tu tarjeta e inténtalo de nuevo.';
      setMessage({ severity: 'error', text });
    } finally {
      setBuying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setMessage(null);
    try {
      await axios.delete('/api/payments/subscription');
      setMessage({ severity: 'success', text: 'Tu suscripción quedará cancelada al final del período pagado.' });
      refresh();
    } catch (e) {
      setMessage({ severity: 'error', text: 'No pudimos cancelar tu suscripción. Contáctanos por WhatsApp.' });
    } finally {
      setCancelling(false);
    }
  };

  const handleResume = async () => {
    setResuming(true);
    setMessage(null);
    try {
      await axios.patch('/api/payments/subscription');
      setMessage({ severity: 'success', text: '¡Listo! Tu suscripción sigue activa y se renovará con normalidad.' });
      refresh();
    } catch (e) {
      setMessage({ severity: 'error', text: 'No pudimos reanudar tu suscripción. Contáctanos por WhatsApp.' });
    } finally {
      setResuming(false);
    }
  };

  return (
    <>
      <Head><title>Créditos y plan</title></Head>
      <Box mt={2} maxWidth={560} mx="auto" pb={8}>
        <Stack spacing={3}>
          <Typography variant="h4" align="center">Créditos y plan</Typography>

          {message && <Alert severity={message.severity}>{message.text}</Alert>}

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700}>{planLabel}</Typography>
                  {isSubscribed && subscription.status === 'payment_failed' && (
                    <Chip size="small" color="warning" label="Problema con el pago" />
                  )}
                  {isSubscribed && subscription.cancelAtPeriodEnd && (
                    <Chip size="small" color="default" label="Se cancela a fin de período" />
                  )}
                </Stack>
                {loading && !credits ? <LinearProgress /> : credits && (
                  <Stack direction="row" spacing={3}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <BoltIcon color="primary" fontSize="small" />
                      <Typography>
                        <b>{credits.monthlyCredits}</b> créditos {user.plan === 'unga' ? 'del mes' : 'de regalo'}
                      </Typography>
                    </Stack>
                    <Typography>
                      <b>{credits.extraCredits}</b> extra
                    </Typography>
                  </Stack>
                )}
                {isSubscribed && subscription.currentPeriodEnd && (
                  <Typography variant="body2" color="text.secondary">
                    Próxima renovación: {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-CL')} ({MONTHLY_CREDITS} créditos nuevos)
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {!isSubscribed && (
            <Card elevation={4} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Chip color="primary" label="Suscripción mensual" />
                  <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography variant="h4" fontWeight={700}>{formatCLP(SUBSCRIPTION_PRICE_CLP)}</Typography>
                    <Typography color="text.secondary">/mes</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {MONTHLY_CREDITS} creaciones con IA al mes · planificación semanal · PDF ·
                    se cobra el 1° de cada mes (el primer mes pagas proporcional) · cancela cuando quieras
                  </Typography>
                  <LoadingButton
                    variant="contained"
                    size="large"
                    fullWidth
                    loading={subscribing}
                    startIcon={<CreditCardIcon />}
                    onClick={handleSubscribe}
                  >
                    Suscribirme con Transbank
                  </LoadingButton>
                  <Typography variant="caption" color="text.secondary">
                    Te llevaremos a Transbank para registrar tu tarjeta de forma segura.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}

          {isSubscribed && (
            <>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography fontWeight={700}>Créditos extra</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Packs de {CREDIT_PACK_SIZE} créditos por {formatCLP(CREDIT_PACK_PRICE_CLP)} ({CREDIT_PACK_SIZE} experiencias más). No vencen y se cobran de inmediato a tu tarjeta registrada.
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                      <Button variant="outlined" size="small" onClick={() => setPacks(Math.max(1, packs - 1))}><RemoveIcon /></Button>
                      <Stack alignItems="center" minWidth={140}>
                        <Typography variant="h6" textAlign="center">
                          +{packCredits} créditos · {formatCLP(packPrice)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          = {packCredits} experiencias
                        </Typography>
                      </Stack>
                      <Button variant="outlined" size="small" onClick={() => setPacks(packs + 1)}><AddIcon /></Button>
                    </Stack>
                    <LoadingButton
                      variant="contained"
                      loading={buying}
                      startIcon={<AddIcon />}
                      onClick={handleBuyPacks}
                    >
                      Comprar {packCredits} créditos por {formatCLP(packPrice)}
                    </LoadingButton>
                  </Stack>
                </CardContent>
              </Card>

              <Divider />
              {subscription.cancelAtPeriodEnd ? (
                <Stack alignItems="center">
                  <LoadingButton variant="outlined" size="small" loading={resuming} onClick={handleResume}>
                    Reanudar mi suscripción
                  </LoadingButton>
                  <Typography variant="caption" color="text.secondary">
                    ¿Te arrepentiste? Reanúdala y sigue disfrutando sin interrupciones.
                  </Typography>
                </Stack>
              ) : (
                <Stack alignItems="center">
                  <LoadingButton color="inherit" size="small" loading={cancelling} onClick={handleCancel}>
                    Cancelar mi suscripción
                  </LoadingButton>
                  <Typography variant="caption" color="text.secondary">
                    Mantendrás el acceso hasta el final del período que ya pagaste.
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Box>
    </>
  );
}
