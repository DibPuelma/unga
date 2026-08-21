import React from 'react';
import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const STEPS = [
  {
    icon: <ChatBubbleOutlineIcon fontSize="large" color="primary" />,
    title: '1. Cuéntale a la IA qué necesitas',
    text: 'Elige la edad de tu grupo, un tema que les interese y los materiales que tienes a mano. Sin escribir prompts complicados.',
  },
  {
    icon: <AutoAwesomeIcon fontSize="large" color="primary" />,
    title: '2. Recibe una experiencia completa',
    text: 'Con inicio, desarrollo y cierre, materiales, preguntas para el aprendizaje y los Objetivos de Aprendizaje de las Bases Curriculares que aborda.',
  },
  {
    icon: <PictureAsPdfIcon fontSize="large" color="primary" />,
    title: '3. Guárdala, agéndala y descárgala',
    text: 'Queda en tu biblioteca personal, la puedes agendar en tu planificación semanal y descargarla en PDF lista para imprimir.',
  },
];

export default function HowItWorks() {
  return (
    <Box id="como-funciona" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" component="h2" align="center" sx={{ fontWeight: 700, color: '#575757', mb: 6, fontSize: { xs: 28, md: 36 } }}>
          Cómo funciona
        </Typography>
        <Grid container spacing={4}>
          {STEPS.map((step) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                {step.icon}
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#575757' }}>{step.title}</Typography>
                <Typography variant="body1" color="text.secondary">{step.text}</Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
