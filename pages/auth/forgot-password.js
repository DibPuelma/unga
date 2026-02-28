import React, { useState } from 'react';
import Image from 'next/image'
import { signIn } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { Box, Container, Paper, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { isEmail } from '../../src/helpers/strings';
import Link from 'src/Link';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    const { user: { id } } = session;
    return {
      redirect: {
        permanent: false,
        destination: `/users/${id}/reset-password`,
      }
    }
  }

  return {
    props: {},
  };
}

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleEmailChange = ({ target: { value } }) => {
    if (!isEmail(value)) {
      setEmailError('Por favor ingresa un email válido');
    } else {
      setEmailError('');
    }
    setEmail(value);
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (Boolean(emailError)) return;

    setLoginLoading(true);
    try {
      const response = await signIn('email', { email: email.trim(), redirect: false });
      if (response.error) {
        setEmailError('No existe un usuario con este correo');
      } else {
        router.replace('/auth/verify');
      }
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
    >
      <Image src="/logo-orange.png" alt="logo" width="128" height="128" />
      <Paper elevation={4} sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" textAlign="center" mb={3}>
          Ingresa tu email
        </Typography>
        <Typography textAlign="center" mb={3}>
          Te enviaremos un link para restablecer o crear tu contraseña
        </Typography>
        <form onSubmit={handleForgotPassword}>
          <TextField
            fullWidth
            variant="outlined"
            label="Ingresa tu email"
            value={email}
            error={Boolean(emailError)}
            helperText={emailError}
            onChange={handleEmailChange}
            sx={{ mb: 3 }}
          />
          <LoadingButton
            type="submit"
            disabled={!Boolean(email)}
            fullWidth
            loading={loginLoading}
            loadingPosition="end"
            variant="contained"
          >
            Restablecer contraseña
          </LoadingButton>
        </form>
        <Box mt={2}>
          <Link href="/auth/login">
            <Typography component="div" variant="caption" textAlign="center">
              Volver al inicio de sesión
            </Typography>
          </Link>
        </Box>
      </Paper>
    </Container>
  )
}