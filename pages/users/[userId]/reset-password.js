import React, { useContext, useState } from 'react';
import { Alert, Container, Snackbar, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { isAuthorized } from 'services/Authorization';
import { MixpanelContext } from 'services/MixpanelContext';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user: { email } } = session;

  return {
    props: {
      userId: context.params.userId,
      userEmail: email,
    },
  };
}

export default function ResetPassword({ userId, userEmail }) {
  const [password, setPassword] = useState({
    newPassword: '',
    repeatPassword: '',
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { trackResetPassword } = useContext(MixpanelContext);

  const handlePasswordChange = ({ target: { name, value } }) => {
    setPassword((oldValue) => ({ ...oldValue, [name]: value }));
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.repeatPassword) {
      setResetError('Las contraseñas no coinciden');
      return;
    }
    setResetLoading(true);

    try {
      await axios.patch('/api/auth/reset-password', { newPassword: password.newPassword })
      // trackResetPassword(userEmail);
      setResetSuccess(true);
    } catch (e) {
      setResetError('Error al cambiar la contraseña')
    } finally {
      setResetLoading(false);
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
      <Typography variant="h4" textAlign="center" mb={3}>
        Cambiar contraseña
      </Typography>
      <form onSubmit={handleResetPassword}>
        <TextField
          fullWidth
          variant="outlined"
          label="Ingresa tu nueva contraseña"
          value={password.newPassword}
          name="newPassword"
          onChange={handlePasswordChange}
          type="password"
          sx={{ mb: 3 }}
        />
        <TextField
          fullWidth
          variant="outlined"
          label="Repite tu nueva contraseña"
          value={password.repeatPassword}
          name="repeatPassword"
          onChange={handlePasswordChange}
          type="password"
          sx={{ mb: 3 }}
        />
        {Boolean(resetError) && (
          <Typography component="div" color="error" variant="caption" textAlign="center">
            {resetError}
          </Typography>
        )}
        <LoadingButton
          type="submit"
          disabled={!Boolean(password.newPassword) || !Boolean(password.repeatPassword)}
          fullWidth
          loading={resetLoading}
          loadingPosition="end"
          variant="contained"
        >
          Guardar cambios
        </LoadingButton>
      </form>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={Boolean(resetSuccess)}
        onClose={() => setResetSuccess(false)}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setResetSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Contraseña cambiada con éxito
        </Alert>
      </Snackbar>
    </Container>
  )
}