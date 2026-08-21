import React from 'react';
import { AppBar, Box, Button, Container, Stack, Toolbar } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingNav() {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #eee', bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Image src="/logo-mark.png" alt="Unga" width={59} height={40} />
            <Box sx={{ fontWeight: 700, fontSize: 22, color: '#575757' }}>Unga</Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button color="inherit" href="#como-funciona">Cómo funciona</Button>
            <Button color="inherit" href="#precio">Precio</Button>
            <Button color="inherit" href="#faq">Preguntas frecuentes</Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href="/auth/login" variant="outlined" color="primary">
              Iniciar sesión
            </Button>
            <Button component={Link} href="/auth/register" variant="contained" color="primary" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              Crear cuenta gratis
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
