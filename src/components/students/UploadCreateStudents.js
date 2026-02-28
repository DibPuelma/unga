import { useContext, useState } from "react";
import { DeleteOutline, DownloadOutlined, SaveOutlined, UploadOutlined } from "@mui/icons-material";
import { Button, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import Papa from "papaparse";
import UngaSelect from "../utils/UngaSelect";
import axios from "axios";
import { MixpanelContext } from "services/MixpanelContext";
import { LoadingButton } from "@mui/lab";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import moment from "moment-timezone";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { cleanFromCSVTemplate } from "src/helpers/strings";
import Link from "src/Link";

const NAME_TO_ERROR = {
  firstName: 'Escribe el nombre',
  lastName: 'Escribe el apellido',
  birthDate: 'Escribe la fecha de nacimiento (Ej, 22-11-2020)',
  rut: 'Escribe el rut sin puntos ni guión',
  classroom: 'Asigna una sala',
}

export default function UploadCreateStudents({ institutionId, allowedClassrooms, onCreate }) {
  const [newStudents, setNewStudents] = useState([]);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const { trackUploadCreateStudents } = useContext(MixpanelContext);

  const handleDownloadTemplate = () => {
    const headers = 'Nombres;Apellidos;Fecha de nacimiento (Ej, 22-11-2020);Rut (sin puntos ni guión);Sala\n';
    const contentArray = []
    allowedClassrooms.forEach((classroom) => {
      contentArray.push(['', '', '', '', classroom.name])
    })
    const content = contentArray.map((row) => row.join(';')).join('\n');
    const BOM = "\uFEFF";
    const csvContent = `data:text/csv;charset=utf-8,${BOM}${headers}${content}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_parvulos_unga.csv');
    document.body.appendChild(link);

    link.click();
  }

  const changeHandler = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setLoadingUpload(true);

    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setFormError('');
        setNewStudents(
          results.data.map((row) => {
            const values = Object.values(row);
            return ({
              tempId: {
                value: Math.random().toString(),
              },
              firstName: {
                value: values[0],
                error: '',
                mandatory: true,
              },
              lastName: {
                value: values[1],
                error: '',
                mandatory: true,
              },
              birthDate: {
                value: values[2] ? moment(values[2], 'DD-MM-YYYY') : '',
                error: '',
              },
              rut: {
                value: values[3],
                error: '',
              },
              classroom: {
                value: allowedClassrooms.find(
                  (classroom) => classroom.name.toLocaleLowerCase().trim() === cleanFromCSVTemplate(values[4].toLocaleLowerCase().trim())
                )?.id || '',
                error: '',
              },
            })
          })
        );
        setLoadingUpload(false);
      },
    });
  };

  const handleClearStudents = () => {
    setNewStudents([]);
  }

  const handleSaveStudents = async () => {
    setLoading(true);
    let error = false;
    setFormError('');
    const newStudentsCopy = [...newStudents];
    newStudentsCopy.forEach((student) => {
      Object.keys(student).forEach((key) => {
        if (!student[key].value && student[key].mandatory) {
          student[key].error = NAME_TO_ERROR[key];
          error = true;
        }
      })
    })
    if (error) {
      setNewStudents(newStudentsCopy);
      setFormError('Falta llenar algún campo');
      setLoading(false);
      return;
    }

    try {
      const studentsToCreate = newStudentsCopy.map((student) => ({
        firstName: student.firstName.value,
        lastName: student.lastName.value,
        birthDate: student.birthDate.value ? moment(student.birthDate.value, 'DD-MM-YYYY').format('YYYY-MM-DD') : null,
        rut: student.rut.value,
        classroom: student.classroom.value,
      }));

      const response = await axios.post(`/api/institutions/${institutionId}/students?massive=true`, studentsToCreate);
      // trackUploadCreateStudents();
      onCreate(response.data);
    } catch (e) {
      setFormError('Ocurrió un error al guardar los párvulos, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  const handleStudentChange = ({ target: { name, value } }, i) => {
    const newStudentsCopy = [...newStudents];
    newStudentsCopy[i][name].value = value;
    if (!value || value.length === 0) newStudentsCopy[i][name].error = NAME_TO_ERROR[name];
    else newStudentsCopy[i][name].error = '';
    setNewStudents(newStudentsCopy);
  }

  const handleBirthDateChange = (moment, i) => {
    const newStudentsCopy = [...newStudents];
    newStudentsCopy[i].birthDate.value = moment;
    setNewStudents(newStudentsCopy);
  }

  const handleDeleteStudent = (tempId) => {
    setNewStudents(newStudents.filter((student) => student.tempId.value !== tempId));
  }

  return (
    <Stack spacing={4} pb={4}>
      <Stack>
        <Typography variant="h6" textAlign="center" gutterBottom>Creación masiva de párvulos</Typography>
        <Stack direction="row" spacing={0.5} alignItems="flex-end">
          <Typography>
            Instrucciones (Solo para computador)
          </Typography>
        </Stack>
        <Typography variant="body2">1.- Descarga la plantilla</Typography>
        <Typography variant="body2">2.- Ábrela en Google Sheets <Link href="https://docs.google.com/spreadsheets" target="_blank" rel="noopener noreferrer">aquí</Link></Typography>
        <Typography variant="body2">3.- Llena los datos, los nombres de las salas y los núcleos tienen que ser exactamente iguales a los de la plataforma</Typography>
        <Typography variant="body2">4.- Guarda la plantilla <b>en formato csv</b></Typography>
        <Typography variant="body2">5.- Sube la plantilla con los datos llenos</Typography>
        <Typography variant="body2">6.- Revisa que esté todo correcto o modifica lo que quieras y luego guarda</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          startIcon={<DownloadOutlined />}
          variant="contained"
          onClick={handleDownloadTemplate}
        >
          Descargar plantilla
        </Button>
        <Button variant="outlined" startIcon={<UploadOutlined />} component="label">
          Subir datos
          <input
            hidden
            type="file"
            name="file"
            accept=".csv"
            onChange={changeHandler}
          />
        </Button>
      </Stack>
      {loadingUpload && (<UngaCircularProgress height={100} text="Cargando párvulos desde el archivo" />)}
      {newStudents.length > 0 && (
        <>
          <Stack width="100%">
            <Typography mb={2}>Párvulos a crear</Typography>
            <Grid container spacing={{ xs: 5, sm: 3 }}>
              {newStudents.map((student, i) => (
                <Grid item xs={12} key={student.tempId.value}>
                  <Grid container columns={24}>
                    <Grid item xs={23}>
                      <Grid container spacing={1} columns={35}>
                        <Grid item xs={35} md={7}>
                          <TextField
                            fullWidth
                            size="small"
                            value={student.firstName.value}
                            label="Nombre"
                            name="firstName"
                            onChange={(e) => handleStudentChange(e, i)}
                            error={Boolean(student.firstName.error)}
                            helperText={Boolean(student.firstName.error) && student.firstName.error}
                          />
                        </Grid>
                        <Grid item xs={35} md={7}>
                          <TextField
                            fullWidth
                            size="small"
                            value={student.lastName.value}
                            label="Apellido"
                            name="lastName"
                            onChange={(e) => handleStudentChange(e, i)}
                            error={Boolean(student.lastName.error)}
                            helperText={Boolean(student.lastName.error) && student.lastName.error}
                          />
                        </Grid>
                        <Grid item xs={35} md={7}>
                          <DesktopDatePicker
                            label="Fecha de nacimiento"
                            inputFormat="DD/MM/yyyy"
                            value={student.birthDate?.value ? moment(student.birthDate.value) : ''}
                            onChange={(moment) => handleBirthDateChange(moment, i)}
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
                        </Grid>
                        <Grid item xs={35} md={7}>
                          <TextField
                            fullWidth
                            size="small"
                            value={student.rut.value}
                            label="Rut"
                            name="rut"
                            onChange={(e) => handleStudentChange(e, i)}
                            error={Boolean(student.rut.error)}
                            helperText={Boolean(student.rut.error) && student.rut.error}
                          />
                        </Grid>
                        <Grid item xs={35} md={7}>
                          <UngaSelect
                            fullWidth
                            size="small"
                            options={allowedClassrooms}
                            label="Salas"
                            name="classroom"
                            value={student.classroom.value}
                            onChange={(e) => handleStudentChange(e, i)}
                            error={Boolean(student.classroom.error)}
                            errorText={Boolean(student.classroom.error) && student.classroom.error}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={1} alignItems={{ xs: 'flex-start', md: 'center' }} display="flex">
                      <IconButton color="error" onClick={() => handleDeleteStudent(student.tempId.value)}>
                        <DeleteOutline />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Stack>
          <Stack alignItems="center">
            {loading && (
              <Typography
                textAlign="center"
                variant="body2"
                mb={2}
                maxWidth={300}
                sx={(theme) => ({ color: theme.palette.warning.main })}
              >
                Guardando párvulos, esto podría tomar varios minutos dependiendo de la cantidad de párvulos a crear
              </Typography>
            )}
            {Boolean(formError) && (
              <Typography textAlign="center" color="error" variant="body2" gutterBottom>
                {formError}
              </Typography>
            )}
            <Stack direction="row" justifyContent="center" spacing={2} alignItems="flex-end">
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearStudents}
                disabled={loading}
              >
                Cancelar
              </Button>
              <LoadingButton
                startIcon={<SaveOutlined />}
                variant="contained"
                onClick={handleSaveStudents}
                loading={loading}
              >
                Guardar párvulos
              </LoadingButton>
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  )
}