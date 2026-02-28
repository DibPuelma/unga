import React from 'react';
import { Container, Paper, Typography } from '@mui/material';

export default function Verify() {
  return (
    <Container maxWidth="xs" sx={{
      height: '80vh',
      pt: '20vh'
    }}
    >
      <Paper elevation={4} sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" textAlign="center" mb={3}>
          Revisa tu correo
        </Typography>
        <Typography variant="h6" textAlign="center" mb={3}>
          Te hemos enviado un link para restablecer tu contraseña. Recuerda revisar spam.
        </Typography>
      </Paper>
    </Container>
  )
}