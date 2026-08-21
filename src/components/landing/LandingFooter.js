import React from 'react';
import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: '#575757', color: 'white', py: 5 }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Image src="/logo-white.png" alt="Unga" width={32} height={32} />
            <Typography sx={{ fontWeight: 700 }}>Unga</Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }}>
            <MuiLink component={Link} href="/privacy-policy" color="inherit" underline="hover">
              Política de privacidad
            </MuiLink>
            <MuiLink component={Link} href="/terms-of-service" color="inherit" underline="hover">
              Términos de servicio
            </MuiLink>
            <MuiLink href="https://wa.me/447543814676" color="inherit" underline="hover" target="_blank" rel="noopener">
              Contáctanos por WhatsApp
            </MuiLink>
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} Unga
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
