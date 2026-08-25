import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { Add, SchoolOutlined } from "@mui/icons-material";
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
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UngaSelect from "src/components/utils/UngaSelect";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import { MixpanelContext } from "services/MixpanelContext";

const INITIAL_FORM = {
  name: '',
  levelId: '',
  mainTeacherId: '',
};

export default function ClassroomsConfiguration() {
  const {
    allClassrooms,
    setAllClassrooms,
    allLevels,
    allEmployees,
    institutionId,
  } = useContext(InstitutionConfigurationContext);
  const { trackCreateClassroom } = useContext(MixpanelContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const dynamicAllClassrooms = useMemo(
    () => [...allClassrooms].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [allClassrooms]
  );

  const teacherOptions = useMemo(
    () => allEmployees.filter((employee) => employee.role === 'teacher' || employee.role === 'coordinator'),
    [allEmployees]
  );

  const getTeacherName = (mainTeacherId) => {
    if (!mainTeacherId) return null;
    const teacher = allEmployees.find((employee) => employee.id === mainTeacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : null;
  };

  const handleOpenDialog = () => {
    setForm(INITIAL_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (creating) return;
    setDialogOpen(false);
  };

  const handleNameChange = ({ target: { value } }) => {
    setForm((oldValue) => ({ ...oldValue, name: value }));
  };

  const handleLevelSelect = (levelId) => {
    setForm((oldValue) => ({ ...oldValue, levelId }));
  };

  const handleTeacherChange = ({ target: { value } }) => {
    setForm((oldValue) => ({ ...oldValue, mainTeacherId: value }));
  };

  const handleCreate = async () => {
    setFormError(null);
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setFormError('Debes ingresar un nombre para la sala');
      return;
    }
    if (!form.levelId) {
      setFormError('Debes seleccionar un nivel');
      return;
    }
    const nameTaken = allClassrooms.some(
      (classroom) => classroom.name?.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameTaken) {
      setFormError('Ya existe una sala con este nombre en tu centro');
      return;
    }

    setCreating(true);
    try {
      const { data } = await axios.post(`/api/institutions/${institutionId}/classrooms`, {
        name: trimmedName,
        levelId: form.levelId,
        mainTeacherId: form.mainTeacherId || undefined,
      });
      setAllClassrooms((oldValue) => [...oldValue, data]);
      trackCreateClassroom({
        classroomId: data.id,
        name: data.name,
        levelId: data.levelId,
        levelName: data.Levels?.name,
        institutionId,
      });
      setDialogOpen(false);
      setForm(INITIAL_FORM);
      setSuccessOpen(true);
    } catch (e) {
      const msg = e.response?.data?.message;
      setFormError(typeof msg === 'string' ? msg : 'No pudimos crear la sala. Intenta de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const renderCreateDialog = () => (
    <Dialog
      open={dialogOpen}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="xs"
      aria-labelledby="create-classroom-dialog-title"
    >
      <DialogTitle id="create-classroom-dialog-title">Agregar sala</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            label="Nombre de la sala"
            placeholder="Ej: Sala Cuna Mayor B"
            helperText="Si ya tienes una sala con ese nivel, distíngelas con una letra o número"
            variant="outlined"
            size="small"
            value={form.name}
            onChange={handleNameChange}
          />
          <Box>
            <Typography variant="body2" mb={1}>Nivel</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {allLevels.map((level) => (
                <Chip
                  key={level.id}
                  label={level.name}
                  color={form.levelId === level.id ? 'primary' : 'default'}
                  variant={form.levelId === level.id ? 'filled' : 'outlined'}
                  onClick={() => handleLevelSelect(level.id)}
                />
              ))}
            </Stack>
          </Box>
          <UngaSelect
            fullWidth
            label="Educadora principal"
            name="mainTeacherId"
            value={form.mainTeacherId}
            onChange={handleTeacherChange}
            options={teacherOptions}
            noSelectionValue={<MenuItem value="">Sin educadora asignada</MenuItem>}
            renderValue={null}
            mapFunction={({ firstName, lastName, id }) => (
              <MenuItem key={id} value={id}>
                {firstName} {lastName}
              </MenuItem>
            )}
          />
          {formError && (
            <Typography variant="body2" color="error">{formError}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} color="secondary" disabled={creating}>
          Cancelar
        </Button>
        <LoadingButton loading={creating} onClick={handleCreate} variant="contained">
          Crear sala
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  if (allClassrooms.length === 0) {
    return (
      <>
        <Stack alignItems="center" textAlign="center" spacing={2} py={6}>
          <SchoolOutlined sx={{ fontSize: 48 }} color="disabled" />
          <Typography variant="subtitle1" fontWeight={500}>Aún no tienes salas creadas</Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={420}>
            Crea tu primera sala para poder agregar párvulos y comenzar a planificar actividades.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
            Agregar sala
          </Button>
        </Stack>
        {renderCreateDialog()}
      </>
    );
  }

  return (
    <>
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight={500}>Todas las salas</Typography>
        <Typography variant="body2" mb={2} color="GrayText">
          Estas son las salas de tu centro. Crea una nueva si aumentó la matrícula y necesitas otra sección.
        </Typography>
        <Stack spacing={2} mb={2}>
          {dynamicAllClassrooms.map((classroom) => (
            <Stack
              key={classroom.id}
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 2, py: 1.5 }}
            >
              <Stack>
                <Typography variant="body2" fontWeight={500}>{classroom.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getTeacherName(classroom.mainTeacherId) || 'Sin educadora asignada'}
                </Typography>
              </Stack>
              <Chip size="small" label={classroom.Levels?.name} />
            </Stack>
          ))}
        </Stack>
        <Button startIcon={<Add />} onClick={handleOpenDialog}>
          Agregar sala
        </Button>
      </Box>
      {renderCreateDialog()}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={successOpen}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setSuccessOpen(false);
        }}
        autoHideDuration={5000}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Sala creada con éxito
        </Alert>
      </Snackbar>
    </>
  );
}
