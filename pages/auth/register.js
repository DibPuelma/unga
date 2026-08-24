import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image'
import { useRouter } from 'next/router';
import { useSession, signIn } from "next-auth/react"
import { Box, Container, IconButton, InputAdornment, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Login as LoginIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { isEmail } from '../../src/helpers/strings';
import Link from 'src/Link';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css'
import UngaSelect from 'src/components/utils/UngaSelect';
import TermsAndConditions from 'src/components/utils/TermsAndConditions';
import { SIGNUP_CREDITS } from 'src/helpers/plans';
import { META_EVENTS, TRIAL_CUSTOM_DATA, trackMetaEvent } from 'src/helpers/metaPixel';

const REFERENCE_OPTIONS = [
  'Instagram',
  'Facebook',
  'Google',
  'Una colega o amiga',
  'Grupo de Whatsapp',
  'Mensaje de Whatsapp de Unga',
  'Folleto promocional',
  'Otro',
];

export default function Register() {
  const router = useRouter();
  const { query: { referrer, role: roleQuery } } = router;
  const session = useSession();
  const isParent = roleQuery === 'parent';
  const [formData, setFormData] = useState({
    firstName: {
      value: '',
      label: 'Nombres*',
      error: '',
    },
    lastName: {
      value: '',
      label: 'Apellidos*',
      error: '',
    },
    email: {
      value: '',
      label: 'Email*',
      error: '',
    },
    phoneNumber: {
      value: '',
      label: 'Número celular',
      error: '',
      optional: true,
    },
    reference: {
      value: referrer ? 'Una colega o amiga' : '',
      label: '¿Cómo te enteraste de Unga?',
      error: '',
      optional: true,
    },
    password: {
      value: '',
      label: 'Contraseña*',
      error: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [country, setCountry] = useState({ name: 'Chile', code: 'cl' });
  const hasAnyError = useMemo(() => (
    Object.keys(formData).reduce((acc, field) => acc || Boolean(formData[field].error), false)
  ), [formData])

  const setFormError = (key, error) => {
    setFormData((oldValue) => ({ ...oldValue, [key]: { ...oldValue[key], error } }))
  }

  const setFormValue = (key, value) => {
    setFormData((oldValue) => ({ ...oldValue, [key]: { ...oldValue[key], value } }))
  }

  const handleTextChange = ({ target: { value, name } }) => {
    let errorMessage = '';
    if (name === 'email' && !isEmail(value)) {
      errorMessage = 'Por favor ingresa un email válido';
    }
    if (errorMessage) setFormError(name, errorMessage);
    else setFormError(name, '');

    setFormValue(name, value);
  }

  const handlePhoneNumberChange = (value, data) => {
    setFormValue('phoneNumber', value);
    if (data.name !== country.name) setCountry({ name: data.name, code: data.countryCode });
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (hasAnyError) return;
    const fields = Object.keys(formData);
    let hasMissingField = false;
    fields.forEach((field) => {
      if (!formData[field].value && !formData[field].optional) {
        setFormError(field, 'Este campo es requerido');
        hasMissingField = true;
      }
    });
    if (hasMissingField) return;

    const {
      firstName: { value: firstName },
      lastName: { value: lastName },
      email: { value: email },
      phoneNumber: { value: phoneNumber },
      password: { value: password },
      reference: { value: reference },
    } = formData;
    setRegisterLoading(true);

    try {
      const response = await axios.post('/api/users', {
        firstName,
        lastName,
        email: email.toLocaleLowerCase().trim(),
        phoneNumber: phoneNumber ? `+${phoneNumber}` : null,
        password,
        country,
        reference: reference || 'No especificado',
        role: isParent ? 'parent' : 'teacher',
        plan: 'free',
      })
      const { data } = response;
      // El servidor sólo devuelve metaEventId cuando la prueba efectivamente
      // comenzó, y ya envió el mismo id por CAPI: Meta une ambos hits en una
      // sola conversión. Se dispara antes de signIn(), que abandona la página.
      if (data.metaEventId) {
        trackMetaEvent(META_EVENTS.START_TRIAL, {
          eventId: data.metaEventId,
          customData: TRIAL_CUSTOM_DATA,
        });
      }
      if (referrer && isEmail(referrer)) {
        await axios.post('/api/referrals', { referrerEmail: referrer, referredUserId: data.id });
      }
      signIn('credentials', { email: email.toLocaleLowerCase().trim(), password, callbackUrl: location.origin })
    } catch (error) {
      const { response } = error;
      if (response?.data?.message === 'instance not unique') {
        setRegisterError('Ya existe un usuario con ese email');
      }
      setRegisterLoading(false);
    }
  }

  useEffect(() => {
    if (session && session.data) {
      router.replace('/');
    }
  }, [session]);

  return (
    <Container maxWidth="xs" sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pb: 8,
    }}
    >
      <Image src="/logo-orange.png" alt="logo" width="128" height="128" />
      <Paper elevation={4} sx={{ py: 4, px: 2 }}>
        <Typography variant="h4" textAlign="center" mb={1}>
          Crea tu cuenta gratis
        </Typography>
        {!isParent && (
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            {SIGNUP_CREDITS} experiencias con IA de regalo. Sin tarjeta.
          </Typography>
        )}
        <form onSubmit={handleRegister}>
          {Object.keys(formData).map((field) => {
            if (field === 'phoneNumber') {
              return (
                <Box mb={2} key={field}>
                  <PhoneInput
                    onlyCountries={['cl', 'ar', 'mx', 'pe', 'co', 'uy', 'ec', 'bo', 'py', 've', 'gt', 'sv', 'hn', 'ni', 'cr', 'pa']}
                    preferredCountries={['cl', 'mx']}
                    country={'cl'}
                    specialLabel="Número celular (opcional)"
                    countryCodeEditable={false}
                    value={formData[field].value}
                    onChange={handlePhoneNumberChange}
                    inputStyle={{ width: '100%', height: 40 }}
                  />
                  {formData[field].error && (
                    <Typography component="div" variant="caption" color="error" pl={2}>
                      {formData[field].error}
                    </Typography>
                  )}
                </Box>
              )
            } else if (field === 'reference') {
              return (
                <UngaSelect
                  fullWidth
                  key={field}
                  error={Boolean(formData.reference.error)}
                  errorText={formData.reference.error}
                  label={formData.reference.label}
                  labelId="reference-label"
                  name="reference"
                  value={formData.reference.value}
                  onChange={handleTextChange}
                  options={REFERENCE_OPTIONS}
                  renderValue={null}
                  sx={{ mb: 2 }}
                  mapFunction={(option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  )}
                />
              )
            } else {
              const isPasswordField = field === 'password';
              return (
                <TextField
                  key={field}
                  fullWidth
                  name={field}
                  variant="outlined"
                  size="small"
                  label={formData[field].label}
                  value={formData[field].value}
                  error={Boolean(formData[field].error)}
                  helperText={formData[field].error}
                  onChange={handleTextChange}
                  sx={{ mb: 2 }}
                  type={isPasswordField && !showPassword ? 'password' : field === 'email' ? 'email' : 'text'}
                  InputProps={isPasswordField ? {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="mostrar contraseña"
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  } : undefined}
                />
              )
            }
          })}

          {registerError && (
            <Typography component="div" variant="caption" color="error" textAlign="center">
              {registerError}
            </Typography>
          )}
          <LoadingButton
            type="submit"
            disabled={hasAnyError}
            fullWidth
            endIcon={<LoginIcon />}
            loading={registerLoading}
            loadingPosition="end"
            variant="contained"
          >
            {isParent ? 'Registrarme' : 'Crear mi cuenta'}
          </LoadingButton>
        </form>
        <Box mt={2}>
          <Link href="/auth/login">
            <Typography component="div" variant="caption" textAlign="center">
              Ya tengo cuenta
            </Typography>
          </Link>
        </Box>
        {!isParent && (
          <Box mt={1}>
            <Link href="/auth/register?role=parent">
              <Typography component="div" variant="caption" textAlign="center">
                ¿Eres mamá o papá? Regístrate aquí
              </Typography>
            </Link>
          </Box>
        )}
        <Box mt={2}>
          <TermsAndConditions />
        </Box>
      </Paper>
    </Container>
  )
}
