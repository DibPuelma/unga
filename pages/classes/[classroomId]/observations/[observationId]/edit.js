import React, { useMemo, useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingButton } from '@mui/lab'
import moment from 'moment-timezone';
import axios from 'axios';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SaveOutlined, ArrowBackOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';

import CloudinaryUploadWidget from 'src/components/utils/CloudinaryUploadWidget';

import { getCores } from 'db/core';
import { getStudentsForClassroom } from 'db/student';
import { getClassroom } from 'db/class';
import { isAuthorized } from 'services/Authorization';
import { getInstitution } from 'db/institution';
import Head from 'next/head';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import { DialogContext } from 'src/context/DialogContext';
import { getObservation } from 'db/observation';
import { useInterval } from 'src/hooks/useInterval';
import { serializeForNextProps } from 'src/helpers/businessLogic';

const AUTOSAVE_INTERVAL = 5000

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user: { institution: { id: institutionId } } } = session;
  const { params: { classroomId, observationId } } = context;
  const cores = await getCores(institutionId);
  const students = await getStudentsForClassroom(classroomId);
  const classroom = await getClassroom(classroomId);
  const institution = await getInstitution(institutionId);
  const observation = await getObservation(observationId);

  return {
    props: serializeForNextProps({
      cores,
      students,
      classroom,
      institution,
      observation,
    }),
  };
}

export default function Observation({ cores, students, classroom, institution, observation }) {
  const router = useRouter();
  const assetsComponentRef = useRef();

  const { setOpen, setTitle, setDescription, handleOnConfirmChange } = useContext(DialogContext);
  const { assets: savedAssets, core: savedCore, description: savedDescription, observedAt: savedObservedAt, students: savedStudents } = observation;
  const [selectedAssets, setSelectedAssets] = useState(savedAssets.length > 0 ? savedAssets.reduce((acc, asset) => {
    acc[asset.asset_id] = asset;
    return acc;
  }, {}) : {});
  const [selectedCore, setSelectedCore] = useState(savedCore ? cores.find((core) => core.id === savedCore.id) : 'No');
  const [observationDescription, setObservationDescription] = useState(savedDescription);
  const [observedAt, setObservedAt] = useState(moment(savedObservedAt));
  const [selectedStudents, setSelectedStudents] = useState(savedStudents);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [observedAtError, setObservedAtError] = useState('');
  const [misspelledWords, setMisspelledWords] = useState([]);
  const handleStudentsChange = (_, value) => setSelectedStudents(value);
  const handleObservationText = ({ target: { value } }) => setObservationDescription(value);
  const handleCoreChange = ({ target: { value } }) => {
    setSelectedCore(value);
  }
  const handleAssetChange = (assets) => setSelectedAssets(assets);

  const handleSnackbarClose = () => {
    setCreateError('');
  };

  useInterval(() => handleSave({ autosave: true }), AUTOSAVE_INTERVAL);

  // Manual spellcheck correction queue: ObservationsList links here with the
  // remaining record ids and the original total, so we can show "registro X
  // de Y" and hand off to the next flagged record on save/skip.
  const spellcheckTotal = Number(router.query.spellcheckTotal) || 0;
  const remainingQueue = router.query.spellcheckQueue ? router.query.spellcheckQueue.split(',').filter(Boolean) : [];
  const currentQueuePosition = spellcheckTotal > 0 ? spellcheckTotal - remainingQueue.length : 0;

  useEffect(() => {
    let cancelled = false;
    axios.get(`/api/observations/${observation.id}/spellcheck`).then(({ data }) => {
      if (!cancelled) setMisspelledWords(data.words);
    });
    return () => { cancelled = true; }
  }, [observation.id]);

  const goToNextInQueue = () => {
    const [nextId, ...rest] = remainingQueue;
    if (!nextId) {
      router.replace(`/classes/${classroom.id}/observations`);
      return;
    }
    const params = new URLSearchParams({ spellcheckTotal: String(spellcheckTotal) });
    if (rest.length > 0) params.set('spellcheckQueue', rest.join(','));
    router.replace(`/classes/${classroom.id}/observations/${nextId}/edit?${params.toString()}`);
  }

  const completedMandatory = useMemo(() => (
    selectedStudents.length > 0 && (observationDescription || Object.keys(selectedAssets).length > 0)
  ), [selectedStudents, observationDescription])

  const isNew = useMemo(() => (
    observation.description === ''
    && !observation.core
    && observation.assets.length === 0
  ), [observation])

  const handleBack = () => {
    if (isNew) {
      setTitle('¿Segura que quieres cancelar la creación?')
      setDescription('Se eliminará esta observación')
      handleOnConfirmChange(handleDelete)
      setOpen(true);
    }
    else {
      router.back();
    }
  }

  const handleDelete = async () => {
    await axios.delete(`/api/observations/${observation.id}`);
    router.back();
  }

  const handleSave = async (options = { autosave: false }) => {
    const { autosave } = options;
    if (!observedAt.isValid()) {
      return;
    }
    setObservedAtError('');
    const core = typeof (selectedCore) === 'string' ?
      null :
      selectedCore

    if (!autosave) setCreateLoading(true);

    try {
      await axios.patch(`/api/observations/${observation.id}`, {
        observedAt,
        core: core?.id,
        students: selectedStudents.map((student) => student.id),
        description: observationDescription,
        assets: Object.values(selectedAssets),
      })

      if (!autosave) {
        if (spellcheckTotal > 0) {
          goToNextInQueue();
        } else {
          router.replace(`/classes/${classroom.id}/observations`);
        }
      }
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
      setCreateLoading(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{
      pb: 4,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <Head>
        <title>Observación {classroom.name}</title>
      </Head>
      <Stack mb={3} mt={1}>
        <TutorialLink id="87b39fe309364a9990fdb28a9cd9a881" />
      </Stack>
      {spellcheckTotal > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {`Registro ${Math.min(currentQueuePosition, spellcheckTotal)} de ${spellcheckTotal}`}
          </Typography>
          <Button size="small" onClick={goToNextInQueue}>Saltar</Button>
        </Stack>
      )}
      <Box>
        <Box mb={2}>
          <Autocomplete
            multiple
            filterSelectedOptions
            id="tags-outlined"
            options={[...savedStudents, ...students]}
            value={selectedStudents}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            onChange={handleStudentsChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecciona uno o más párvulos"
              />
            )}
          />
        </Box>
        <Box mb={2}>
          <TextField
            multiline
            fullWidth
            variant="outlined"
            label="Escribe la observación"
            value={observationDescription}
            minRows={4}
            maxRows={4}
            onChange={handleObservationText}
          />
          {misspelledWords.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
              {misspelledWords.map(({ word, suggestions }) => (
                <Chip
                  key={word}
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={suggestions?.[0] ? `${word} (sug: ${suggestions[0]})` : word}
                />
              ))}
            </Stack>
          )}
        </Box>
        <Box mb={2}>
          <DatePicker
            renderInput={(props) => (
              <TextField
                {...props}
                fullWidth
                error={Boolean(observedAtError)}
                helperText={observedAtError}
              />
            )}
            inputFormat="DD/MM/YYYY"
            mask="__/__/____"
            label="Fecha de la observación"
            minutesStep={5}
            showToolbar={false}
            okText="Aceptar"
            cancelText="Cancelar"
            maxDate={moment()}
            value={observedAt}
            onChange={(newValue) => {
              if (!newValue.isValid()) {
                setObservedAtError('Formato de fecha inválido');
              } else {
                setObservedAtError('');
              }
              setObservedAt(newValue);
            }}
          />
        </Box>
        {!institution.observationsWithoutMultimedia && (
          <Box mb={4}>
            <CloudinaryUploadWidget
              assets={selectedAssets}
              onAssetChange={handleAssetChange}
              ref={assetsComponentRef}
              buttonTitle={Object.keys(selectedAssets).length === 0 ? 'Agregar imágenes o videos' : 'Agregar más imágenes o videos'}
              fullWidth
            />
          </Box>
        )}
        <Box mb={2}>
          <TextField
            fullWidth
            select
            variant="outlined"
            label="¿Quieres asociar la observación a un núcleo de aprendizaje?"
            value={selectedCore}
            onChange={handleCoreChange}
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
        </Box>
      </Box>
      <Box pb={2}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Button startIcon={<ArrowBackOutlined />} fullWidth variant="outlined" color="error" onClick={handleBack}>
              Atrás
            </Button>
          </Grid>
          <Grid item xs={8}>
            <LoadingButton
              fullWidth
              startIcon={<SaveOutlined />}
              loading={createLoading}
              loadingPosition="start"
              variant="contained"
              disabled={!completedMandatory || Boolean(observedAtError)}
              onClick={handleSave}
            >
              Guardar registro
            </LoadingButton>
          </Grid>
        </Grid>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={Boolean(createError)}
        onClose={handleSnackbarClose}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {`${createError}. No se pudo crear la observación`}
        </Alert>
      </Snackbar>
    </Container>
  )
};