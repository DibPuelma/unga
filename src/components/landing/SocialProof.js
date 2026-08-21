import React from 'react';
import { Avatar, Box, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

// Placeholder testimonials — replace content with real quotes from marketing.
const TESTIMONIALS = [
  {
    name: 'Educadora de párvulos',
    detail: 'Jardín infantil, Santiago',
    quote: 'Antes planificar una semana me tomaba una tarde entera. Ahora creo las experiencias en minutos y me quedan alineadas a las bases.',
  },
  {
    name: 'Educadora de párvulos',
    detail: 'Sala cuna, Valparaíso',
    quote: 'Lo que más valoro es que las experiencias vienen con los OA identificados. Imprimo el PDF y lo dejo en mi carpeta de planificación.',
  },
];

export default function SocialProof() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" component="h2" align="center" sx={{ fontWeight: 700, color: '#575757', mb: 6, fontSize: { xs: 28, md: 36 } }}>
          Hecho para educadoras
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {TESTIMONIALS.map((t, i) => (
            <Grid item xs={12} md={5} key={i}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <FormatQuoteIcon color="primary" />
                    <Typography variant="body1" color="text.secondary">{t.quote}</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{t.name[0]}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#575757' }}>{t.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.detail}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
