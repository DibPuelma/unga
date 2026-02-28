import React, { useState, useContext, useEffect, useMemo } from 'react';
import Image from 'next/image'
import { useRouter } from 'next/router';
import { useSession, signIn } from "next-auth/react"
import { Box, Container, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Login as LoginIcon } from '@mui/icons-material';
import { isEmail } from '../../src/helpers/strings';
import { MixpanelContext } from '../../services/MixpanelContext';
import Link from 'src/Link';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css'
import UngaSelect from 'src/components/utils/UngaSelect';
import TermsAndConditions from 'src/components/utils/TermsAndConditions';

const fieldsInputTypes = {
  firstName: 'text',
  lastName: 'text',
  email: 'email',
  phoneNumber: 'text',
  password: 'password',
  confirmPassword: 'password',
}

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
  const { trackSignUp } = useContext(MixpanelContext);
  const router = useRouter();
  const { query: { referrer } } = router;
  const session = useSession();
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
    },
    reference: {
      value: referrer ? 'Una colega o amiga' : '',
      label: '¿Cómo te enteraste de Unga?*',
      error: '',
    },
    password: {
      value: '',
      label: 'Contraseña*',
      error: '',
    },
    confirmPassword: {
      value: '',
      label: 'Confirma tu contraseña*',
      error: '',
    },
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [country, setCountry] = useState({ name: '', code: '' });
  const hasAnyError = useMemo(() => {
    Object.keys(formData).reduce((acc, field) => acc || Boolean(formData[field].error), false)
  }, [formData])

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
    if (name === 'confirmPassword' && value !== formData.password.value) {
      errorMessage = 'Las contraseñas no coinciden'
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
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!formData[field].value && !formData[field].optional) return setFormError(field, 'Este campo es requerido');
    }

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
        phoneNumber: `+${phoneNumber}`,
        password,
        country,
        reference,
        plan: 'trial',
      })
      const { data } = response;
      if (referrer && isEmail(referrer)) {
        await axios.post('/api/referrals', { referrerEmail: referrer, referredUserId: data.id });
      }
      // trackSignUp({ userId: data.id, email, firstName, lastName, plan: 'trial' });
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
        <Typography variant="h4" textAlign="center" mb={3}>
          Regístrate
        </Typography>
        <form onSubmit={handleRegister}>
          {Object.keys(formData).map((field) => {
            if (field === 'phoneNumber') {
              return (
                <Box mb={2} key={field}>
                  <PhoneInput
                    onlyCountries={['cl', 'ar', 'mx', 'pe', 'co', 'uy', 'ec', 'bo', 'py', 've', 'gt', 'sv', 'hn', 'ni', 'cr', 'pa']}
                    preferredCountries={['cl', 'mx']}
                    country={'cl'}
                    specialLabel="Número celular"
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
                  type={fieldsInputTypes[field]}
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
            Registrarme
          </LoadingButton>
        </form>
        <Box mt={2}>
          <Link href="/auth/login">
            <Typography component="div" variant="caption" textAlign="center">
              Ya tengo cuenta
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