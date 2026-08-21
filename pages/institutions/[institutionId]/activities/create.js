import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ReplayIcon from '@mui/icons-material/Replay';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { isAuthorized } from 'services/Authorization';
import { getInstitutionLevels } from 'db/level';
import { serializeForNextProps } from 'src/helpers/businessLogic';
import { ALL_NUCLEOS } from 'services/openai/curriculum/bcep-cl';
import { tramoFromLevelName } from 'services/openai/curriculum/tramos';
import PaywallDialog from 'src/components/dialogs/PaywallDialog';
import DownloadActivityPdfButton from 'src/components/activity/DownloadActivityPdfButton';
import usePaywall from 'src/hooks/usePaywall';
import useCredits from 'src/hooks/useCredits';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { user } = await getServerSession(context.req, context.res, authOptions);
  const { institutionId } = context.params;
  const levels = await getInstitutionLevels(institutionId);

  return {
    props: serializeForNextProps({
      user,
      institutionId,
      levels: levels.filter(Boolean),
    }),
  };
}

const THEME_EXAMPLES = [
  'Los dinosaurios',
  'El fondo del mar',
  'Las emociones',
  'Mi familia',
  'La primavera',
  'Los oficios',
  'El espacio',
  'Animales de la granja',
];

const MATERIAL_SUGGESTIONS = [
  'plasticina', 'témpera', 'papel kraft', 'material reciclado', 'bloques',
  'lápices de colores', 'cartulina', 'pegamento', 'tijeras', 'telas', 'instrumentos musicales',
];

const DURATIONS = [15, 30, 45];

export default function CreateExperience({ user, institutionId, levels }) {
  const router = useRouter();
  const isFirst = router.query.first === '1';
  const { credits, refresh: refreshCredits } = useCredits();
  const { paywall, openPaywallFromResponse, closePaywall } = usePaywall();

  const [selectedLevelId, setSelectedLevelId] = useState(levels.length === 1 ? levels[0].id : null);
  const [theme, setTheme] = useState('');
  const [nucleoId, setNucleoId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [duration, setDuration] = useState(null);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraContext, setExtraContext] = useState('');

  const [phase, setPhase] = useState('form'); // form | generating | review
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const selectedLevel = useMemo(() => levels.find((l) => l.id === selectedLevelId), [levels, selectedLevelId]);
  const canSubmit = Boolean(selectedLevelId && theme.trim());

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setPhase('generating');
    setError('');
    try {
      const { data } = await axios.post('/api/ai/generate-experience', {
        tramo: tramoFromLevelName(selectedLevel.name),
        theme: theme.trim(),
        nucleoIds: nucleoId ? [nucleoId] : [],
        materials,
        durationMinutes: duration,
        extraContext: extraContext.trim() || undefined,
        levelIds: [selectedLevelId],
      });
      setResult(data);
      setPhase('review');
      refreshCredits();
    } catch (e) {
      const status = e.response?.status;
      setPhase('form');
      if (status === 402) {
        openPaywallFromResponse(e.response);
      } else if (status === 429) {
        setError('Estás creando muy rápido. Espera un momento e inténtalo de nuevo.');
      } else {
        setError('No pudimos crear la experiencia. No se descontó tu crédito, inténtalo de nuevo.');
      }
    }
  };

  const experience = result?.experience;

  return (
    <>
      <Head><title>Crear con IA</title></Head>
      <Box maxWidth={720} mx="auto" pb={8}>
        {phase === 'form' && (
          <Stack spacing={3}>
            <Stack spacing={1} textAlign="center">
              <Typography variant="h4" sx={(t) => ({ color: t.palette.primary.main })}>
                {isFirst ? '¡Creemos tu primera experiencia!' : 'Crear experiencia con IA'}
              </Typography>
              <Typography color="text.secondary">
                Cuéntanos qué necesitas y la IA creará una experiencia alineada a las Bases Curriculares.
              </Typography>
            </Stack>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography fontWeight={600} gutterBottom>¿Para qué nivel?</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {levels.map((level) => (
                        <Chip
                          key={level.id}
                          label={level.name}
                          color={selectedLevelId === level.id ? 'primary' : 'default'}
                          variant={selectedLevelId === level.id ? 'filled' : 'outlined'}
                          onClick={() => setSelectedLevelId(level.id)}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography fontWeight={600} gutterBottom>
                      ¿Qué tema o interés de los niños quieres trabajar?
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Ej: los dinosaurios, las emociones, el otoño…"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                    <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
                      {THEME_EXAMPLES.map((example) => (
                        <Chip
                          key={example}
                          label={example}
                          size="small"
                          variant="outlined"
                          onClick={() => setTheme(example)}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography fontWeight={600} gutterBottom>
                      Núcleo de aprendizaje <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography>
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {ALL_NUCLEOS.map((nucleo) => (
                        <Chip
                          key={nucleo.id}
                          label={nucleo.name}
                          size="small"
                          color={nucleoId === nucleo.id ? 'primary' : 'default'}
                          variant={nucleoId === nucleo.id ? 'filled' : 'outlined'}
                          onClick={() => setNucleoId(nucleoId === nucleo.id ? null : nucleo.id)}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography fontWeight={600} gutterBottom>
                      Materiales disponibles <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography>
                    </Typography>
                    <Autocomplete
                      multiple
                      freeSolo
                      options={MATERIAL_SUGGESTIONS}
                      value={materials}
                      onChange={(_, value) => setMaterials(value)}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Escribe y presiona Enter" />
                      )}
                    />
                  </Box>

                  <Box>
                    <Typography fontWeight={600} gutterBottom>
                      Duración <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography>
                    </Typography>
                    <Stack direction="row" gap={1}>
                      {DURATIONS.map((minutes) => (
                        <Chip
                          key={minutes}
                          label={`${minutes}${minutes === 45 ? '+' : ''} min`}
                          color={duration === minutes ? 'primary' : 'default'}
                          variant={duration === minutes ? 'filled' : 'outlined'}
                          onClick={() => setDuration(duration === minutes ? null : minutes)}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Button size="small" color="inherit" onClick={() => setExtraOpen(!extraOpen)}>
                      ¿Algo más que quieras contarle a la IA?
                    </Button>
                    <Collapse in={extraOpen}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        sx={{ mt: 1 }}
                        placeholder="Ej: tengo un grupo de 20 niños, la sala es pequeña, quiero algo para el patio…"
                        value={extraContext}
                        onChange={(e) => setExtraContext(e.target.value)}
                      />
                    </Collapse>
                  </Box>

                  {error && (
                    <Typography variant="body2" color="error" textAlign="center">{error}</Typography>
                  )}

                  <Stack alignItems="center" spacing={1}>
                    <LoadingButton
                      variant="contained"
                      size="large"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={handleGenerate}
                      disabled={!canSubmit}
                      sx={{ px: 5, py: 1.5 }}
                    >
                      Crear experiencia (usa 1 crédito)
                    </LoadingButton>
                    {credits && (
                      <Typography variant="caption" color="text.secondary">
                        Te quedan {credits.remaining} {credits.remaining === 1 ? 'crédito' : 'créditos'}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {phase === 'generating' && (
          <Stack spacing={3} alignItems="center" mt={10} textAlign="center">
            <AutoAwesomeIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5">Estamos creando tu experiencia…</Typography>
            <Typography color="text.secondary">
              La IA está diseñando el inicio, desarrollo y cierre, y eligiendo los Objetivos de Aprendizaje. Toma unos 20 segundos.
            </Typography>
            <Box width="60%"><LinearProgress /></Box>
          </Stack>
        )}

        {phase === 'review' && experience && (
          <Stack spacing={3}>
            <Typography variant="h5" textAlign="center" sx={(t) => ({ color: t.palette.primary.main })}>
              ¡Tu experiencia está lista! 🎉
            </Typography>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {selectedLevel && <Chip size="small" label={selectedLevel.name} />}
                    {experience.durationMinutes ? <Chip size="small" color="primary" label={`${experience.durationMinutes} min`} /> : null}
                  </Stack>
                  <Typography variant="h5" fontWeight={700}>{experience.name}</Typography>
                  <Typography color="text.secondary">{experience.summary}</Typography>

                  {experience.materials?.length > 0 && (
                    <Box>
                      <Typography fontWeight={700} gutterBottom>Materiales</Typography>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {experience.materials.map((m) => <Chip key={m} size="small" variant="outlined" label={m} />)}
                      </Stack>
                    </Box>
                  )}

                  {['inicio', 'desarrollo', 'cierre'].map((momento) => (
                    <Box key={momento}>
                      <Typography fontWeight={700} sx={{ textTransform: 'capitalize' }} gutterBottom>{momento}</Typography>
                      <Stack component="ul" sx={{ m: 0, pl: 3 }} spacing={0.5}>
                        {experience.steps[momento].map((step, i) => (
                          <Typography component="li" key={i} variant="body2">{step}</Typography>
                        ))}
                      </Stack>
                    </Box>
                  ))}

                  <Divider />
                  <Box>
                    <Typography fontWeight={700} gutterBottom>Objetivos de Aprendizaje (BCEP)</Typography>
                    <Stack spacing={1}>
                      {experience.oas.map((oa) => (
                        <Box key={`${oa.nucleo}-${oa.code}`}>
                          <Typography variant="body2" fontWeight={600}>
                            {oa.code} · {oa.nucleo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">{oa.text}</Typography>
                          <Typography variant="caption" color="primary">{oa.comoSeAborda}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {experience.preguntasParaElAprendizaje?.length > 0 && (
                    <Box>
                      <Typography fontWeight={700} gutterBottom>Preguntas para el aprendizaje</Typography>
                      <Stack component="ul" sx={{ m: 0, pl: 3 }} spacing={0.5}>
                        {experience.preguntasParaElAprendizaje.map((pregunta, i) => (
                          <Typography component="li" key={i} variant="body2">{pregunta}</Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {experience.adaptaciones?.length > 0 && (
                    <Box>
                      <Typography fontWeight={700} gutterBottom>Adaptaciones</Typography>
                      <Stack spacing={0.5}>
                        {experience.adaptaciones.map((adaptacion, i) => (
                          <Typography key={i} variant="body2">
                            <b style={{ textTransform: 'capitalize' }}>{adaptacion.tipo}:</b> {adaptacion.descripcion}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<LibraryBooksIcon />}
                onClick={() => router.push(`/institutions/${institutionId}/activities`)}
              >
                Ver en mi biblioteca
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/institutions/${institutionId}/activities/${result.activity.id}/edit`)}
              >
                Editar detalles
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={handleGenerate}
              >
                Volver a generar (1 crédito)
              </Button>
              <DownloadActivityPdfButton
                institutionId={institutionId}
                activityId={result.activity.id}
                activityName={experience.name}
              />
            </Stack>
            {credits && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Te quedan {credits.remaining} {credits.remaining === 1 ? 'crédito' : 'créditos'}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
      <PaywallDialog open={paywall.open} variant={paywall.variant} onClose={closePaywall} />
    </>
  );
}
