import React from 'react';
import { Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';

// Static showcase of a generated experience — no fetching, pure marketing.
export default function ExampleExperienceCard() {
  return (
    <Card elevation={6} sx={{ borderRadius: 3, maxWidth: 480, mx: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1}>
            <Chip size="small" label="Nivel Medio (2 a 4 años)" />
            <Chip size="small" color="primary" label="30 min" />
          </Stack>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#575757' }}>
            Un océano en la muralla
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Los niños y niñas crean colectivamente un gran mural del fondo del mar estampando
            con esponjas, conversando sobre las criaturas marinas y eligiendo dónde ubicar cada una.
          </Typography>
          <Divider />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#575757' }}>
            OBJETIVOS DE APRENDIZAJE (BCEP)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            OA 1 · Exploración del entorno natural — Manifestar interés y asombro por elementos del entorno natural…
          </Typography>
          <Typography variant="caption" color="text.secondary">
            OA 7 · Lenguajes artísticos — Representar a través del dibujo sus ideas e intereses…
          </Typography>
          <Divider />
          <Stack direction="row" spacing={1}>
            <Chip size="small" variant="outlined" label="Inicio" />
            <Chip size="small" variant="outlined" label="Desarrollo" />
            <Chip size="small" variant="outlined" label="Cierre" />
            <Chip size="small" variant="outlined" label="5 preguntas" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
