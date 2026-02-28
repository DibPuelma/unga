import { useContext, useState } from "react";
import moment from "moment-timezone";
import { Close, DeleteOutlined, SaveOutlined } from "@mui/icons-material";
import { Alert, Button, CircularProgress, Grid, IconButton, Snackbar, Stack, TextField } from "@mui/material";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { validateRUT } from "src/helpers/validators/rutValidator";
import axios from "axios";
import { cleanDateToSendToDB, cleanDateForFrontend } from "src/helpers/businessLogic";
import UngaSelect from "../utils/UngaSelect";
import { MixpanelContext } from "services/MixpanelContext";
import { LoadingButton } from "@mui/lab";

const INITIAL_STUDENT = {
  firstName: '',
  lastName: '',
  birthDate: '',
  rut: '',
  classroom: '',
};

export default function EditOrCreateStudent({
  student: propsStudent = null,
  onChange,
  showErrors,
  onSave,
  onCancel,
  allowedClassrooms,
}) {
  const cleanPropsStudent = { ...propsStudent };
  if (cleanPropsStudent.birthDate) {
    cleanPropsStudent.birthDate = cleanDateForFrontend(cleanPropsStudent.birthDate);
  }
  const { trackCreateStudent } = useContext(MixpanelContext);
  const [student, setStudent] = useState(cleanPropsStudent ?
    {
      firstName: cleanPropsStudent.firstName,
      lastName: cleanPropsStudent.lastName,
      birthDate: cleanPropsStudent.birthDate,
      rut: cleanPropsStudent.rut,
    } :
    INITIAL_STUDENT
  );
  const [loading, setLoading] = useState(false);
  const [rutError, setRutError] = useState(false);

  const handleBirthDateChange = (moment) => {
    const newStudent = { ...student, birthDate: moment };
    setStudent(newStudent);
    if (onChange) onChange(newStudent);
  }

  const handleStudentPropertyChange = ({ target: { value, name } }) => {
    const newStudent = { ...student, [name]: value };
    setStudent(newStudent);
    if (onChange) onChange(newStudent);
  };

  const handleRemoveFields = () => {
    onRemove()
  }

  const handleClassroomChange = async ({ target: { value } }) => {
    const newStudent = { ...student, classroom: value };
    setStudent(newStudent);
    if (onChange) onChange(newStudent);
  }

  const saveChangesToDB = async () => {
    if (!student.firstName || !student.lastName || (allowedClassrooms && !student.classroom)) return;
    setLoading(true);
    setRutError(false);

    try {
      const cleanBirthDate = cleanDateToSendToDB(student.birthDate);
      const body = {
        ...student,
        birthDate: cleanBirthDate,
      }
      let response = null;
      if (propsStudent) {
        response = await axios.patch(`/api/students/${propsStudent.id}`, body)
      } else {
        response = await axios.post('/api/students', body);
        // trackCreateStudent(body);
      }
      onSave(response.data);
      onCancel();
    } catch (err) {
      if (err?.response?.data?.message === 'instance not unique') {
        setRutError(true);
      }
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="flex-start" spacing={1} width="100%">
        <TextField
          value={student.firstName}
          onChange={handleStudentPropertyChange}
          size="small"
          name="firstName"
          label="Nombres"
          error={showErrors && !Boolean(student.firstName)}
          helperText={showErrors && !Boolean(student.firstName) && 'No puede estar vacío'}
          fullWidth
        />
        <TextField
          value={student.lastName}
          onChange={handleStudentPropertyChange}
          size="small"
          name="lastName"
          label="Apellidos"
          error={showErrors && !Boolean(student.lastName)}
          helperText={showErrors && !Boolean(student.lastName) && 'No puede estar vacío'}
          fullWidth
        />
        <DesktopDatePicker
          label="Fecha de nacimiento"
          inputFormat="DD/MM/yyyy"
          value={student.birthDate || ''}
          onChange={handleBirthDateChange}
          renderInput={(params) => (
            <TextField
              {...params}
              error={false}
              fullWidth
              size="small"
            />
          )}
          maxDate={moment()}
        />
        <TextField
          value={student.rut}
          onChange={handleStudentPropertyChange}
          size="small"
          name="rut"
          label="Rut"
          error={showErrors && Boolean(student.rut) && !validateRUT(student.rut)}
          helperText={showErrors && student.rut && !validateRUT(student.rut) && 'No es válido'}
          fullWidth
        />
        {allowedClassrooms && (
          <UngaSelect
            fullWidth
            value={student.classroom}
            onChange={handleClassroomChange}
            options={allowedClassrooms}
            label="Sala"

          />
        )}
        <Stack
          direction="row"
          alignItems="center"
          columnGap={1}
          width={{ xs: "100%", sm: 'inherit' }}
          justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
        >
          {onCancel && (
            <>
              <IconButton onClick={onCancel} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <Close color="error" />
              </IconButton>
              <Button
                variant="outlined"
                color="error"
                onClick={onCancel}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                Cancelar
              </Button>
            </>
          )}
          {onSave && (
            <>
              <IconButton onClick={saveChangesToDB} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                {loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <SaveOutlined color="primary" />
                )}
              </IconButton>
              <LoadingButton
                fullWidth
                startIcon={<SaveOutlined />}
                variant="contained"
                color="primary"
                onClick={saveChangesToDB}
                loading={loading}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                Guardar
              </LoadingButton>
            </>
          )}
        </Stack>
      </Stack>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={rutError}
        onClose={() => setRutError(false)}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setRutError(false)} severity="error" sx={{ width: '100%' }}>
          El rut del alumno existe en otra sala o institución
        </Alert>
      </Snackbar>
    </>
  )
}