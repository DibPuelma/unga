import React, { useState, useContext, useEffect } from 'react';
import Image from 'next/image'
import { useRouter } from 'next/router';
import { useSession, signIn } from "next-auth/react"
import { Box, Button, Container, Paper, TextField, Typography, useTheme } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Login as LoginIcon } from '@mui/icons-material';
import { isEmail } from '../../src/helpers/strings';
import { MixpanelContext } from '../../services/MixpanelContext';
import Link from 'src/Link';
import TermsAndConditions from 'src/components/utils/TermsAndConditions';

export default function Login() {
  const { trackLogin } = useContext(MixpanelContext);
  const router = useRouter();
  const { query } = router;
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const handleEmailChange = ({ target: { value } }) => {
    if (!isEmail(value)) {
      setEmailError('Por favor ingresa un email válido');
    } else {
      setEmailError('');
    }
    setEmail(value);
  }

  const handlePasswordChange = ({ target: { value } }) => {
    setPassword(value);
  }

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    signIn('credentials', { email: email.toLocaleLowerCase().trim(), password, callbackUrl: location.origin })
  }

  useEffect(() => {
    if (session && session.data) {
      // trackLogin();
      router.replace('/');
    }
  }, [session]);

  useEffect(() => {
    if (query.error) {
      setLoginError(true);
    }
  }, [query])

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
          Inicia sesión
        </Typography>
        <form onSubmit={handleLogin}>
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
          <TextField
            fullWidth
            variant="outlined"
            label="Ingresa tu contraseña"
            value={password}
            type="password"
            onChange={handlePasswordChange}
            sx={{ mb: 3 }}
          />
          {loginError && (
            <Typography component="div" color="error" variant="caption" textAlign="center">
              Email o contraseña inválida
            </Typography>
          )}
          <LoadingButton
            type="submit"
            disabled={Boolean(emailError) || !Boolean(email) || !Boolean(password)}
            fullWidth
            endIcon={<LoginIcon />}
            loading={loginLoading}
            loadingPosition="end"
            variant="contained"
          >
            Ingresar
          </LoadingButton>
        </form>
        <Box mt={1}>
          <Link
            noLinkStyle
            sx={{ width: '100%' }}
            href="/auth/register">
            <Button fullWidth variant="outlined">
              Registrarme
            </Button>
          </Link>
        </Box>
        <Box mt={2}>
          <Link href="/auth/forgot-password">
            <Typography component="div" variant="caption" textAlign="center">
              Olvidé o no tengo mi contraseña
            </Typography>
          </Link>
        </Box>
        <Box mt={2}>
          <TermsAndConditions />
        </Box>
      </Paper>
    </Container>
  )
}