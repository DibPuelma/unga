import { AddCircleOutline } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Autocomplete, Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import moment from "moment-timezone";
import { useContext, useMemo, useRef, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import useSWR from "swr";
import ObservationCard from "../observations/ObservationCard";
import ObservationsList from "../observations/ObservationsList";
import CloudinaryUploadWidget from "../utils/CloudinaryUploadWidget";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import UngaError from "../utils/UngaError";

export default function PlannedActivityObservations({
  plannedActivityId,
  classroom,
  students,
  cores,
  plannedDate,
  activityName,
}) {
  const { trackCreateObservation, trackCreatePlannedActivityObservation } = useContext(MixpanelContext);
  const assetsComponentRef = useRef();
  const [newObservation, setNewObservation] = useState({
    students: [],
    description: '',
    assets: {},
    core: 'No',
    observedAt: moment(plannedDate).add(9, 'hours'),
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const classroomId = classroom.id;
  const { data, error, mutate } = useSWR(
    `/api/classrooms/${classroomId}/planned-activities/${plannedActivityId}/observations`,
    axios,
  );
  const completedMandatoryFields = useMemo(() => (
    newObservation.students.length > 0 && (
      newObservation.description || Object.keys(newObservation.assets).length > 0
    )
  ), [newObservation])

  const handleObservationChange = (name, value) => {
    setNewObservation((oldValue) => ({ ...oldValue, [name]: value }));
  }

  const clearFields = () => {
    setNewObservation({
      students: [],
      description: '',
      assets: {},
      core: 'No',
      observedAt: moment(plannedDate),
    })
    assetsComponentRef.current?.clearAssets();
  }

  const handleCreate = async () => {
    const {
      students,
      description,
      assets,
      core,
      observedAt,
    } = newObservation;
    const selectedCore = core === 'No' ? null : core;

    setCreateError('');
    setCreateLoading(true);

    try {
      await axios.post(`/api/observations`, {
        observedAt,
        description,
        core: selectedCore?.id,
        students: students.map((student) => student.id),
        assets: Object.values(assets),
        classroom: classroomId,
        plannedActivity: plannedActivityId,
      })
      await mutate();
      // trackCreatePlannedActivityObservation({
      //   classroom: classroom.name,
      //   core: selectedCore?.name,
      //   date: plannedDate,
      //   activity: activityName,
      // });
      students.forEach((student) => {
        // trackCreateObservation(
        //   classroom.name,
        //   selectedCore?.name,
        //   null,
        //   student.fullName,
        // )
      })
      clearFields();
    } catch (error) {
      switch (error.message) {
        case 'Network Error':
          setCreateError('No hay conexión');
          break;
        case 'Request aborted due to timeout':
          setCreateError('La conexión está muy lenta');
          break;
        default:
          setCreateError('Error desconocido');
          break;
      }
    } finally {
      setCreateLoading(false)
    }
  }

  if (!data) return (
    <UngaCircularProgress />
  )

  if (error) return (
    <UngaError text="No pudimos cargar las observaciones de la actividad" />
  )

  return (
    <>
      <Box mb={4}>
        <ObservationsList noSearch observations={data.data} columns={{ xs: 1, sm: 3, lg: 4 }} />
      </Box>
      <Stack spacing={2} alignItems="flex-start" width={{ xs: '100%', md: '50%'}}>
        <Typography variant="h6">Agregar nueva observación</Typography>
        <Autocomplete
          fullWidth
          multiple
          filterSelectedOptions
          id="tags-outlined"
          options={students}
          value={newObservation.students}
          getOptionLabel={(option) => option.fullName}
          onChange={(_, students) => handleObservationChange('students', students)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Selecciona uno o más párvulos"
            />
          )}
        />
        <TextField
          multiline
          fullWidth
          variant="outlined"
          label="Escribe la observación"
          value={newObservation.description}
          minRows={4}
          maxRows={4}
          onChange={({ target: { value } }) => handleObservationChange('description', value)}
        />
        <CloudinaryUploadWidget
          onAssetChange={(assets) => handleObservationChange('assets', assets)}
          ref={assetsComponentRef}
          buttonTitle={
            Object.keys(newObservation.assets).length === 0
              ? 'Agregar imágenes o videos'
              : 'Agregar más imágenes o videos'
          }
          fullWidth
        />
        <TextField
          fullWidth
          select
          variant="outlined"
          label="¿Quieres asociar la observación a un núcleo de aprendizaje?"
          value={newObservation.core}
          onChange={({ target: { value } }) => handleObservationChange('core', value)}
        >
          <MenuItem value="No">
            No
          </MenuItem>
          {cores.map((core) => (
            <MenuItem key={core.id} value={core}>
              {core.name}
            </MenuItem>
          ))}
        </TextField>
        <Stack>
          {createError && <Typography variant="caption" color="error">{createError}</Typography>}
          <LoadingButton
            endIcon={<AddCircleOutline />}
            loading={createLoading}
            loadingPosition="end"
            variant="contained"
            disabled={!completedMandatoryFields}
            onClick={handleCreate}
          >
            Agregar observación
          </LoadingButton>
        </Stack>
      </Stack>
    </>
  )
}