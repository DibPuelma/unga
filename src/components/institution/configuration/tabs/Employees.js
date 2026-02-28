import { useContext, useState } from "react";
import axios from "axios";
import { Add, DeleteOutlined, SaveOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Chip, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
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
      promises.push(axios.post(`/api/institutions/${institutionId}/users`, {
        ...employee,
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
      console.error(e);
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
      const { firstName, lastName, email } = newEmployeesData[i];
      if (!firstName || !lastName || !email) {
        setFormError('Debes llenar todos los campos de las nuevas docente');
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
          Recuerda que todas pueden ingresar con su correo y contraseña
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
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    variant="outlined"
                    value={firstName}
                    size="small"
                    name="firstName"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                  />
                  <TextField
                    fullWidth
                    label="Apellidos"
                    variant="outlined"
                    value={lastName}
                    size="small"
                    name="lastName"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
                  />
                  <TextField
                    fullWidth
                    label="Correo"
                    variant="outlined"
                    value={email}
                    size="small"
                    name="email"
                    onChange={(e) => handleNewEmployeeChange(e, id)}
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
      <ConfirmationDialog />
    </>
  )
}