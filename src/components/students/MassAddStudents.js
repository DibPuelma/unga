import { useState } from "react";
import { Add, SaveOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Alert, Button, Divider, Grid, Snackbar, Stack, Typography } from "@mui/material";
import EditOrCreateStudent from "./EditOrCreateStudent";
import { validateRUT } from "src/helpers/validators/rutValidator";
import axios from "axios";

export default function MassAddStudents({ classroom, onSave }) {
  const [newStudents, setNewStudents] = useState({});
  const [formErrors, setFormErrors] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [rutError, setRutError] = useState(false);

  const handleSaveStudents = async () => {
    setFormErrors(false);
    setSaveLoading(true);
    setRutError(false);
    setSaveError(false);
    const promises = [];
    const newStudentsArray = Object.values(newStudents);
    for (let i = 0; i < newStudentsArray.length; i++) {
      const element = newStudentsArray[i];
      if (!element.firstName || !element.lastName || (element.rut && !validateRUT(element.rut))) {
        setFormErrors(true);
        setSaveLoading(false);
        return;
      }
    }
    newStudentsArray.forEach((student) => {
      promises.push(axios.post(`/api/students`, {
        ...student,
        birthDate: student.birthDate ? student.birthDate.format('yyyy-MM-DD') : null,
        classroom: classroom.id,
      }))
    })

    try {
      const responses = await Promise.all(promises);
      setNewStudents({});
      const cleanNewStudents = responses.map((response) => ({
        ...response.data,
        fullName: `${response.data.firstName} ${response.data.lastName}`
      }));
      onSave(cleanNewStudents);
    } catch (err) {
      if (err?.response?.data?.message === 'instance not unique') {
        setRutError(true);
      } else {
        setSaveError(true);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNewStudentChange = (id, student) => {
    setNewStudents((oldValue) => ({ ...oldValue, [id]: student }))
  }

  const handleNewStudentRemove = (id) => {
    setNewStudents((oldValue) => {
      const newNewStudents = { ...oldValue };
      delete newNewStudents[id];
      return newNewStudents;
    });
  }

  const addStudentForm = () => {
    const id = Math.random().toString();
    setNewStudents((oldValue) => ({
      ...oldValue,
      [id]: {
        firstName: '',
        lastName: '',
        birthDate: '',
        rut: '',
      },
    }));
  };

  return (
    <>
      <Grid container spacing={1} justifyContent="flex-end">
        <Grid item xs={12}>
          {Object.entries(newStudents).map(([id, newStudent], i) => (
            <Stack key={id}>
              <EditOrCreateStudent
                key={id}
                student={newStudent}
                onChange={(student) => handleNewStudentChange(id, student)}
                onCancel={(student) => handleNewStudentRemove(id, student)}
                showErrors={formErrors}
              />
              { i < Object.entries(newStudents).length - 1 && <Divider sx={{ my: 2 }} /> }
            </Stack>
          ))}
        </Grid>
        <Grid item xs={12} sm={6} mt={2}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addStudentForm}
            fullWidth
          >
            {Object.entries(newStudents).length > 0 ? 'Agregar otro párvulo' : 'Agregar párvulo'}
          </Button>
        </Grid>
        {Object.keys(newStudents).length > 0 && (
          <Grid item xs={12} sm={6} mt={{ xs: 1, sm: 2 }}>
            <LoadingButton
              variant="contained"
              startIcon={<SaveOutlined />}
              onClick={handleSaveStudents}
              fullWidth
              loading={saveLoading}
              loadingPosition="start"
              disabled={saveLoading}
            >
              Guardar párvulos
            </LoadingButton>
          </Grid>
        )}
        {saveError && (
          <Grid item xs={12}>
            <Typography color="error">No pudimos guardar los párvulos. Comunícate con nosotros.</Typography>
          </Grid>
        )}
      </Grid>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={rutError}
        onClose={() => setRutError(false)}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setRutError(false)} severity="error" sx={{ width: '100%' }}>
          Ingresaste ruts duplicados o alguno ya existe en otra sala o institución
        </Alert>
      </Snackbar>
    </>
  )
}