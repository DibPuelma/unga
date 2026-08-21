import React from 'react';
import { Box, Button, Card, CardContent, Chip, Container, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { SUBSCRIPTION_PRICE_CLP, MONTHLY_CREDITS, SIGNUP_CREDITS } from 'src/helpers/plans';

const FEATURES = [
  `${MONTHLY_CREDITS} creaciones con IA al mes`,
  'Biblioteca personal de experiencias',
  'Planificación semanal (calendario)',
  'Descarga en PDF lista para imprimir',
  'Alineado a las Bases Curriculares de la Educación Parvularia',
];

const formatCLP = (n) => `$${n.toLocaleString('es-CL')}`;

export default function PricingSection() {
  return (
    <Box id="precio" sx={{ bgcolor: '#fff7f2', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Typography variant="h3" component="h2" align="center" sx={{ fontWeight: 700, color: '#575757', mb: 2, fontSize: { xs: 28, md: 36 } }}>
          Un solo plan, simple
        </Typography>
        <Typography align="center" color="text.secondary" sx={{ mb: 5 }}>
          Parte gratis: crea {SIGNUP_CREDITS} experiencias sin registrar tarjeta.
        </Typography>
        <Card elevation={6} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2} alignItems="center">
              <Chip color="primary" label="Suscripción mensual" />
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#575757' }}>
                  {formatCLP(SUBSCRIPTION_PRICE_CLP)}
                </Typography>
                <Typography variant="h6" color="text.secondary">/mes</Typography>
              </Stack>
              <List dense sx={{ width: '100%' }}>
                {FEATURES.map((feature) => (
                  <ListItem key={feature} disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              <Button
                component={Link}
                href="/auth/register"
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.5, fontSize: 17 }}
              >
                Comenzar gratis
              </Button>
              <Typography variant="caption" color="text.secondary">
                Sin tarjeta para partir · Cancela cuando quieras · ¿Necesitas más? Compra créditos extra
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
