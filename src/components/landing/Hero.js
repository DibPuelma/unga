import React from 'react';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Link from 'next/link';
import ExampleExperienceCard from './ExampleExperienceCard';

export default function Hero() {
  return (
    <Box sx={{ bgcolor: '#fff7f2', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center">
          <Stack spacing={3} flex={1}>
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Con inteligencia artificial"
              color="primary"
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
            <Typography variant="h2" component="h1" sx={{ fontWeight: 700, color: '#575757', fontSize: { xs: 34, md: 48 } }}>
              Crea experiencias de aprendizaje en segundos
            </Typography>
            <Typography variant="h6" sx={{ color: '#7a7a7a', fontWeight: 400 }}>
              Unga ayuda a educadoras de párvulo a planificar experiencias alineadas a las
              Bases Curriculares de la Educación Parvularia, listas para usar, agendar e imprimir.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={Link}
                href="/auth/register"
                variant="contained"
                size="large"
                sx={{ px: 4, py: 1.5, fontSize: 18 }}
              >
                Crear cuenta gratis — sin tarjeta
              </Button>
              <Button href="#como-funciona" variant="text" size="large">
                Ver cómo funciona
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ color: '#9a9a9a' }}>
              5 experiencias con IA de regalo al registrarte.
            </Typography>
          </Stack>
          <Box flex={1} sx={{ width: '100%', display: { xs: 'none', sm: 'block' } }}>
            <ExampleExperienceCard />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
