import { useContext, useState } from "react";
import axios from "axios";
import { Add, DeleteOutlined, SaveOutlined, Visibility, VisibilityOff, VpnKey } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import UngaSelect from "src/components/utils/UngaSelect";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import { ascendingSort } from "src/helpers/arrays";
import ConfirmationDialog from "src/components/dialogs/ConfirmationDialog";
import { DialogContext } from "src/context/DialogContext";

export default function EmployeesConfiguration({
  onSave,
  loading,
}) {
  const {
    employeesRolesConfig,
    setEmployeesRolesConfig,
    setReportConfig,
    allEmployees,
    principal,
    allClassrooms,
    institutionId,
  } = useContext(InstitutionConfigurationContext)
  const {
    title,
    setTitle,
    setDescription,
    handleOnConfirmChange,
    setOpen,
  } = useContext(DialogContext);
  const principalName = `${principal?.firstName} ${principal?.lastName}`;
  const [classroomsByEmployee, setClassroomsByEmployee] = useState(
    allEmployees.reduce((acc, employee) => {
      acc[employee.id] = employee.classrooms;
      return acc;
    }, {})
  );
  const [dynamicAllEmployees, setDynamicAllEmployees] = useState(ascendingSort(allEmployees, 'firstName'));
  const [newEmployees, setNewEmployees] = useState({});
  const [formError, setFormError] = useState(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  /** Keys: `resetPassword`, `resetPasswordConfirm`, `${newRowId}-password`, `${newRowId}-passwordConfirm` */
  const [passwordFieldVisible, setPasswordFieldVisible] = useState({});
  const [passwordResetSuccessOpen, setPasswordResetSuccessOpen] = useState(false);

  const togglePasswordFieldVisible = (key) => {
    setPasswordFieldVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isPasswordFieldVisible = (key) => Boolean(passwordFieldVisible[key]);

  const handleEmployeesRoleChange = ({ target: { value, name } }) => {
    if (value === 'noSelection') {
      setReportConfig((oldValue) => ({
        ...oldValue,
        signers: {
          ...oldValue.signers,
          coordinator: false,
        }
      }));
    }
    setEmployeesRolesConfig((oldValue) => ({ ...oldValue, [name]: value }));
  }

  const handleEmployeesClassroomChange = ({ target: { value } }, id) => {
    setClassroomsByEmployee((oldValue) => ({ ...oldValue, [id]: value }));
  }

  const handleNewEmployeeChange = ({ target: { value, name } }, id) => {
    setNewEmployees((oldValue) => ({
      ...oldValue, [id]: {
        ...oldValue[id],
        [name]: value,
      }
    }));
  }

  const handleAddEmployee = () => {
    const newId = `new-${Object.keys(newEmployees).length}`;
    setNewEmployees((oldValue) => ({
      ...oldValue, [newId]: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        passwordConfirm: '',
      }
    }));
    setClassroomsByEmployee((oldValue) => ({ ...oldValue, [newId]: [] }));
  }

  const handleDeleteNewEmployee = (id) => {
    const newNewEmployees = { ...newEmployees };
    delete newNewEmployees[id];
    const newClassroomsByEmployee = { ...classroomsByEmployee };
    delete newClassroomsByEmployee[id];
    setNewEmployees(newNewEmployees);
    setClassroomsByEmployee(newClassroomsByEmployee);
  }

  const handleConfirmDeleteDialogOpen = (firstName, lastName, id) => {
    setTitle('Quitar educadora');
    setDescription(`¿Estás seguro que deseas quitar a ${firstName} ${lastName} del centro?`);
    handleOnConfirmChange(() => handleDeleteOldEmployee(id));
    setOpen(true);
  }

  const handleDeleteOldEmployee = async (id) => {
    try {
      await axios.delete(`/api/institutions/${institutionId}/users/${id}`);
      const newDynamicAllEmployees = dynamicAllEmployees.filter((employee) => employee.id !== id);
      const newClassroomsByEmployee = { ...classroomsByEmployee };
      delete newClassroomsByEmployee[id];
      setDynamicAllEmployees(newDynamicAllEmployees);
      setClassroomsByEmployee(newClassroomsByEmployee);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSaveNewEmployees = async () => {
    const promises = [];
    Object.entries(newEmployees).forEach(([id, employee]) => {
      const { passwordConfirm: _pc, ...employeePayload } = employee;
      promises.push(axios.post(`/api/institutions/${institutionId}/users`, {
        ...employeePayload,
        password: employee.password?.trim(),
        email: employee.email.trim().toLocaleLowerCase(),
        role: 'teacher',
        plan: 'institutional',
        classrooms: classroomsByEmployee[id],
      }));
    });
    try {
      const responses = await Promise.all(promises);
      const newClassroomsByEmployee = { ...classroomsByEmployee };
      const newDynamicAllEmployees = [...dynamicAllEmployees];
      responses.forEach((response) => {
        newClassroomsByEmployee[response.data.id] = response.data.classrooms;
        newDynamicAllEmployees.push(response.data);
      });
      setClassroomsByEmployee(newClassroomsByEmployee);
      setDynamicAllEmployees(newDynamicAllEmployees);
      setNewEmployees({});
    } catch (e) {
      const msg = e.response?.data?.message;
      setFormError(typeof msg === 'string' ? msg : 'No pudimos crear las docentes. Revisa los datos e intenta de nuevo.');
      throw e;
    }
  }

  const updateClassrooms = async () => {
    const promises = []
    Object.entries(classroomsByEmployee).forEach(([id, classrooms]) => {
      if (id.includes('new')) return;

      promises.push(axios.patch(`/api/users/${id}`, { classrooms }))
    })
    await Promise.all(promises);
  }

  const internalSave = async () => {
    await handleSaveNewEmployees();
    await updateClassrooms();
  }

  const handleInternalSave = async () => {
    setFormError(null);
    const newEmployeesData = Object.values(newEmployees);
    for (let i = 0; i < newEmployeesData.length; i++) {
      const { firstName, lastName, email, password, passwordConfirm } = newEmployeesData[i];
      if (!firstName || !lastName || !email) {
        setFormError('Debes llenar todos los campos de las nuevas docente');
        return;
      }
      const pwd = password?.trim() || '';
      if (pwd.length < 6) {
        setFormError('Cada nueva docente debe tener una contraseña de al menos 6 caracteres');
        return;
      }
      if (pwd !== (passwordConfirm?.trim() || '')) {
        setFormError('Las contraseñas no coinciden en el formulario de nuevas docentes');
        return;
      }
    }
    const cleanEmployeesRoles = { ...employeesRolesConfig };
    if (employeesRolesConfig.coordinator === 'noSelection') cleanEmployeesRoles.coordinator = null;

    const body = {
      configuration: {
        employeesRoles: cleanEmployeesRoles,
      }
    };

    onSave({ body, internalSave });
  }

  const handleCloseResetPassword = () => {
    if (resetPasswordLoading) return;
    setResetPasswordOpen(false);
    setResetPasswordUser(null);
    setResetPasswordError(null);
    setPasswordFieldVisible((prev) => {
      const next = { ...prev };
      delete next.resetPassword;
      delete next.resetPasswordConfirm;
      return next;
    });
  };

  const handleSubmitResetPassword = async () => {
    setResetPasswordError(null);
    const pwd = resetPassword.trim();
    if (pwd.length < 6) {
      setResetPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (pwd !== resetPasswordConfirm.trim()) {
      setResetPasswordError('Las contraseñas no coinciden');
      return;
    }
    if (!resetPasswordUser) return;
    setResetPasswordLoading(true);
    try {
      await axios.patch(`/api/users/${resetPasswordUser.id}`, { password: pwd });
      setResetPasswordOpen(false);
      setResetPasswordUser(null);
      setResetPassword('');
      setResetPasswordConfirm('');
      setPasswordFieldVisible((prev) => {
        const next = { ...prev };
        delete next.resetPassword;
        delete next.resetPasswordConfirm;
        return next;
      });
      setPasswordResetSuccessOpen(true);
    } catch (e) {
      const msg = e.response?.data?.message;
      setResetPasswordError(typeof msg === 'string' ? msg : 'No pudimos actualizar la contraseña');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <>
      <Box mb={3}>
        <Typography variant="subtitle1" my={1} fontWeight={500}>Roles</Typography>
        <Stack spacing={2}>
          <Stack
            spacing={0.5}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="body2">Directora</Typography>
            <TextField
              disabled
              variant="outlined"
              value={principalName}
              size="small"
            />
          </Stack>
          <Stack
            spacing={0.5}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="body2" >Coordinadora</Typography>
            <UngaSelect
              sx={{ minWidth: '13rem' }}
              name="coordinator"
              value={employeesRolesConfig.coordinator || 'noSelection'}
              onChange={handleEmployeesRoleChange}
              options={dynamicAllEmployees}
              noSelectionValue={<MenuItem value="noSelection">Sin coordinadora</MenuItem>}
              renderValue={null}
              mapFunction={({ firstName, lastName, id }) => (
                <MenuItem key={id} value={id}>
                  {firstName} {lastName}
                </MenuItem>
              )}
              errorText
            />
          </Stack>
        </Stack>
      </Box>
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight={500}>Todas las docentes</Typography>
        <Typography variant="body2" mb={2} color="GrayText">
          Las docentes ingresan con correo y contraseña. Al dar de alta a alguien nueva, define su contraseña aquí; puedes cambiarla después con &quot;Restablecer contraseña&quot;.
        </Typography>
        <Stack spacing={4} mb={2}>
          {dynamicAllEmployees.map(({ firstName, lastName, email, id }) => (
            <Stack key={id} direction="row" spacing={2} alignItems="flex-start">
              <Stack
                width="100%"
                spacing={1.5}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <Stack width={{ xs: '100%', sm: '50%' }}>
                  <Typography variant="body2">{firstName} {lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{email}</Typography>
                </Stack>
                <UngaSelect
                  multiple
                  fullWidth
                  label="Salas"
                  name={`classrooms_employee_${id}`}
                  value={classroomsByEmployee[id]}
                  onChange={(event) => handleEmployeesClassroomChange(event, id)}
                  options={allClassrooms}
                />
              </Stack>
              <Tooltip title="Restablecer contraseña">
                <IconButton
                  onClick={() => {
                    setResetPasswordUser({ id, firstName, lastName });
                    setResetPassword('');
                    setResetPasswordConfirm('');
                    setResetPasswordError(null);
                    setResetPasswordOpen(true);
                  }}
                  size="small"
                  aria-label="Restablecer contraseña"
                >
                  <VpnKey fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => handleConfirmDeleteDialogOpen(firstName, lastName, id)}>
                <DeleteOutlined color="error" />
              </IconButton>
            </Stack>
          ))}
          {Object.entries(newEmployees).map(([id, { firstName, lastName, email }]) => (
            <Stack key={id} direction="row" alignItems="flex-start" spacing={2}>
              <Stack
                width="100%"
                spacing={1}
              >
                <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    variant="outlined"
                    value={firstName}
                    size="small"
                    name="firstName"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                    sx={{ flex: '1 1 160px', minWidth: 140 }}
                  />
                  <TextField
                    fullWidth
                    label="Apellidos"
                    variant="outlined"
                    value={lastName}
                    size="small"
                    name="lastName"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                    sx={{ flex: '1 1 160px', minWidth: 140 }}
                  />
                  <TextField
                    fullWidth
                    label="Correo"
                    variant="outlined"
                    value={email}
                    size="small"
                    name="email"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                    sx={{ flex: '1 1 200px', minWidth: 180 }}
                  />
                </Stack>
                <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Contraseña"
                    type={isPasswordFieldVisible(`${id}-password`) ? 'text' : 'password'}
                    variant="outlined"
                    value={newEmployees[id]?.password || ''}
                    size="small"
                    name="password"
                    autoComplete="new-password"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                    sx={{ flex: '1 1 200px', minWidth: 180 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={isPasswordFieldVisible(`${id}-password`) ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onClick={() => togglePasswordFieldVisible(`${id}-password`)}
                            edge="end"
                            size="small"
                          >
                            {isPasswordFieldVisible(`${id}-password`) ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Confirmar contraseña"
                    type={isPasswordFieldVisible(`${id}-passwordConfirm`) ? 'text' : 'password'}
                    variant="outlined"
                    value={newEmployees[id]?.passwordConfirm || ''}
                    size="small"
                    name="passwordConfirm"
                    autoComplete="new-password"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                    sx={{ flex: '1 1 200px', minWidth: 180 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={isPasswordFieldVisible(`${id}-passwordConfirm`) ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onClick={() => togglePasswordFieldVisible(`${id}-passwordConfirm`)}
                            edge="end"
                            size="small"
                          >
                            {isPasswordFieldVisible(`${id}-passwordConfirm`) ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
                <UngaSelect
                  multiple
                  fullWidth
                  label="Salas"
                  name={`classrooms_employee_${id}`}
                  value={classroomsByEmployee[id]}
                  onChange={(event) => handleEmployeesClassroomChange(event, id)}
                  options={allClassrooms}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={allClassrooms.find((classroom) => classroom.id === value).name}
                          color="info"
                        />
                      ))}
                    </Box>
                  )}
                />
              </Stack>
              <IconButton onClick={() => handleDeleteNewEmployee(id)}>
                <DeleteOutlined color="error" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button
          startIcon={<Add />}
          onClick={handleAddEmployee}
        >
          Agregar docente
        </Button>
      </Box>
      <Stack display="flex" alignItems="flex-end">
        {formError && <Typography variant="body2" color="error" gutterBottom>{formError}</Typography>}
        <LoadingButton
          sx={{ width: { xs: '100%', sm: 'inherit' } }}
          loading={loading}
          loadingPosition="start"
          variant="contained"
          onClick={handleInternalSave}
          startIcon={<SaveOutlined />}
        >
          Guardar cambios
        </LoadingButton>
      </Stack>
      <Dialog
        open={resetPasswordOpen}
        onClose={handleCloseResetPassword}
        fullWidth
        maxWidth="xs"
        aria-labelledby="reset-password-dialog-title"
      >
        <DialogTitle id="reset-password-dialog-title">
          Restablecer contraseña
          {resetPasswordUser && (
            <Typography component="span" variant="body2" display="block" color="text.secondary" fontWeight={400} mt={0.5}>
              {resetPasswordUser.firstName} {resetPasswordUser.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nueva contraseña"
              type={isPasswordFieldVisible('resetPassword') ? 'text' : 'password'}
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              size="small"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={isPasswordFieldVisible('resetPassword') ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => togglePasswordFieldVisible('resetPassword')}
                      edge="end"
                      size="small"
                    >
                      {isPasswordFieldVisible('resetPassword') ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirmar contraseña"
              type={isPasswordFieldVisible('resetPasswordConfirm') ? 'text' : 'password'}
              value={resetPasswordConfirm}
              onChange={(e) => setResetPasswordConfirm(e.target.value)}
              size="small"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={isPasswordFieldVisible('resetPasswordConfirm') ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => togglePasswordFieldVisible('resetPasswordConfirm')}
                      edge="end"
                      size="small"
                    >
                      {isPasswordFieldVisible('resetPasswordConfirm') ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {resetPasswordError && (
              <Typography variant="body2" color="error">{resetPasswordError}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetPassword} color="secondary" disabled={resetPasswordLoading}>
            Cancelar
          </Button>
          <LoadingButton loading={resetPasswordLoading} onClick={handleSubmitResetPassword} variant="contained">
            Guardar contraseña
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={passwordResetSuccessOpen}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setPasswordResetSuccessOpen(false);
        }}
        autoHideDuration={5000}
      >
        <Alert
          onClose={() => setPasswordResetSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Contraseña actualizada correctamente
        </Alert>
      </Snackbar>
      <ConfirmationDialog />
    </>
  )
}