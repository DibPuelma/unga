import { useContext, useState } from "react";
import { DeleteOutline, DownloadOutlined, OndemandVideoOutlined, SaveOutlined, UploadOutlined } from "@mui/icons-material";
import { Button, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import Papa from "papaparse";
import UngaSelect from "../utils/UngaSelect";
import axios from "axios";
import { MixpanelContext } from "services/MixpanelContext";
import { LoadingButton } from "@mui/lab";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import TutorialLink from "../tutorials/TutorialLink";
import { cleanFromCSVTemplate } from "src/helpers/strings";
import Link from "src/Link";

const NAME_TO_ERROR = {
  name: 'Escribe el nombre del indicador',
  core: 'Elige un núcleo',
  classrooms: 'Elige al menos una sala',
}

export default function UploadCreateObjectives({ institutionId, allCores, allowedClassrooms, onCreate }) {
  const [newObjectives, setNewObjectives] = useState([]);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const { trackMassCreateObjectives } = useContext(MixpanelContext);

  const handleDownloadTemplate = () => {
    const headers = 'Nombre del indicador; Nombre del núcleo; Nombre de la sala\n';
    const contentArray = []
    allowedClassrooms.forEach((classroom) => {
      allCores.forEach((core) => {
        contentArray.push(['', core.name, classroom.name])
      })
    })
    const content = contentArray.map((row) => row.join(';')).join('\n');
    const BOM = "\uFEFF";
    const csvContent = `data:text/csv;charset=utf-8,${BOM}${headers}${content}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'plantilla_indicadores_unga.csv');
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
        setNewObjectives(
          results.data.map((row) => {
            const values = Object.values(row)
            return ({
              tempId: Math.random().toString(),
              name: {
                value: values[0],
                error: '',
              },
              core: {
                value: allCores.find(
                  (core) => core.name.toLocaleLowerCase().trim() === cleanFromCSVTemplate(values[1].toLocaleLowerCase().trim())
                )?.id,
                error: '',
              },
              classrooms: {
                value: allowedClassrooms.filter(
                  (classroom) => classroom.name.toLocaleLowerCase().trim() === cleanFromCSVTemplate(values[2].toLocaleLowerCase().trim())
                ).map((classroom) => classroom.id),
                error: '',
              },
            })
          })
        );
        setLoadingUpload(false);
      },
    });
  };

  const handleClearObjectives = () => {
    setNewObjectives([]);
  }

  const handleSaveObjectives = async () => {
    setLoading(true);
    let error = false;
    setFormError('');
    const newObjectivesCopy = [...newObjectives];
    newObjectivesCopy.forEach((objective) => {
      if (!objective.name.value) {
        objective.name.error = NAME_TO_ERROR.name;
        error = true;
      }
      if (!objective.core.value) {
        objective.core.error = NAME_TO_ERROR.core;
        error = true;
      }
      if (objective.classrooms.value.length === 0) {
        objective.classrooms.error = NAME_TO_ERROR.classrooms;
        error = true;
      }
    })
    if (error) {
      setNewObjectives(newObjectivesCopy);
      setFormError('Falta llenar algún campo');
      setLoading(false);
      return;
    }

    try {
      const objectivesToCreate = newObjectivesCopy.map((objective) => ({
        name: objective.name.value,
        coreId: objective.core.value,
        classroomsIds: objective.classrooms.value,
      }));

      const allClassroomIds = objectivesToCreate.reduce((acc, cur) => [...acc, ...cur.classroomsIds], []);
      const uniqueClassroomIds = allClassroomIds.filter((item, index) => allClassroomIds.indexOf(item) === index);
      const response = await axios.post(`/api/institutions/${institutionId}/objectives?massive=true`, {
        objectives: objectivesToCreate,
        classroomsIds: uniqueClassroomIds,
      });
      // trackMassCreateObjectives();
      onCreate(response.data);
    } catch (e) {
      setFormError('Ocurrió un error al guardar los indicadores, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  const handleObjectiveChange = ({ target: { name, value } }, i) => {
    const newObjectivesCopy = [...newObjectives];
    newObjectivesCopy[i][name].value = value;
    if (!value || value.length === 0) newObjectivesCopy[i][name].error = NAME_TO_ERROR[name];
    else newObjectivesCopy[i][name].error = '';
    setNewObjectives(newObjectivesCopy);
  }

  const handleDeleteObjective = (tempId) => {
    setNewObjectives(newObjectives.filter((objective) => objective.tempId !== tempId));
  }

  return (
    <Stack spacing={4} pb={4}>
      <Stack>
        <Typography variant="h6" textAlign="center" gutterBottom>Creación masiva de indicadores</Typography>
        <TutorialLink id="b9200f2e37b74ce0a66fa2bace046070" />
        <Stack direction="row" spacing={0.5} alignItems="flex-end">
          <Typography>
            Instrucciones (Solo para computador)
          </Typography>
        </Stack>
        <Typography variant="body2">1.- Descarga la plantilla</Typography>
        <Typography variant="body2">2.- Ábrela en Google Sheets <Link href="https://docs.google.com/spreadsheets" target="_blank" rel="noopener noreferrer">aquí</Link></Typography>
        <Typography variant="body2">3.- Llena los datos. Los nombres de las salas y los núcleos tienen que ser exactamente iguales a los de la plataforma</Typography>
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
      {loadingUpload && (<UngaCircularProgress height={100} text="Cargando indicadores desde el archivo" />)}
      {newObjectives.length > 0 && (
        <>
          <Stack width="100%">
            <Typography mb={2}>Indicadores a crear</Typography>
            <Grid container spacing={{ xs: 5, sm: 3 }}>
              {newObjectives.map((objective, i) => (
                <Grid item xs={12} key={objective.tempId}>
                  <Grid container columns={24}>
                    <Grid item xs={23}>
                      <Grid container spacing={1} columns={36}>
                        <Grid item xs={36} md={16}>
                          <TextField
                            fullWidth
                            size="small"
                            value={objective.name.value}
                            label="Nombre del indicador"
                            name="name"
                            onChange={(e) => handleObjectiveChange(e, i)}
                            error={Boolean(objective.name.error)}
                            helperText={Boolean(objective.name.error) && objective.name.error}
                          />
                        </Grid>
                        <Grid item xs={36} sm={16} md={8}>
                          <UngaSelect
                            fullWidth
                            size="small"
                            options={allCores}
                            label="Núcleo"
                            name="core"
                            value={objective.core.value}
                            onChange={(e) => handleObjectiveChange(e, i)}
                            error={Boolean(objective.core.error)}
                            errorText={Boolean(objective.core.error) && objective.core.error}
                          />
                        </Grid>
                        <Grid item xs={36} sm={20} md={12}>
                          <UngaSelect
                            fullWidth
                            multiple
                            size="small"
                            options={allowedClassrooms}
                            label="Salas"
                            name="classrooms"
                            value={objective.classrooms.value}
                            onChange={(e) => handleObjectiveChange(e, i)}
                            error={Boolean(objective.classrooms.error)}
                            errorText={Boolean(objective.classrooms.error) && objective.classrooms.error}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={1} alignItems={{ xs: 'flex-start', md: 'center' }} display="flex">
                      <IconButton color="error" onClick={() => handleDeleteObjective(objective.tempId)}>
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
                Guardando indicadores, esto podría tomar varios minutos dependiendo de la cantidad de indicadores a crear
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
                onClick={handleClearObjectives}
                disabled={loading}
              >
                Cancelar
              </Button>
              <LoadingButton
                startIcon={<SaveOutlined />}
                variant="contained"
                onClick={handleSaveObjectives}
                loading={loading}
              >
                Guardar indicadores
              </LoadingButton>
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  )
}