import { useContext, useState } from "react"
import { Close } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab"
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography, useMediaQuery } from "@mui/material"
import axios from "axios";
import { useRouter } from "next/router";
import { MixpanelContext } from "services/MixpanelContext";

const PROMPT_EXAMPLES = [
  `Tengo plumones, escarcha y pegamento. ¿Que actividad puedo hacer para un nivel con alumnos de 2 a 3 años con esos materiales?`,
  `Tengo 5 cajas de plasticina, palos de helado y papel de diario. ¿Qué actividad puedo hacer con esos materiales con niños de 1 a 2 años?`,
  `Quiero hacer una actividad para niños de 3 a 4 años para potenciar convivencia y ciudadanía y trabajar disfrutar instancias de interacción social con diversas personas de la comunidad. ¿Qué actividad me recomiendas?`,
  `Quiero trabajar el pensamiento matemático de niños entre 4 y 5 años. ¿Qué actividad me recomiendas?`,
  `Quiero trabajar la capacidad de niños entre 3 a 4 años para expresarse oralmente en forma clara y comprensible. ¿Qué actividad puedo hacer?`,
];

export default function SuggestActivities({ institutionId }) {
  const {
    trackOpenSuggestActivity,
    trackRequestSuggestActivity,
    trackWaitedForSuggestedActivity,
    trackEditSuggestedActivity
  } = useContext(MixpanelContext);
  const router = useRouter();
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const [exampleIndex, setExampleIndex] = useState(Math.ceil(Math.random() * 4));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptChanged, setPromptChanged] = useState(true);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionRequest, setSuggestionRequest] = useState({
    loading: false,
    error: false,
  });

  const handleOpenModal = () => {
    setDialogOpen(true);
    // trackOpenSuggestActivity();
  }

  const handlePromptChange = (e) => {
    setPromptChanged(true);
    setPrompt(e.target.value);
  }

  const handleSuggestionRequest = async () => {
    setSuggestion('');
    setSuggestionRequest({ loading: true, error: false });
    // trackRequestSuggestActivity();
    try {
      const response = await axios.get(`/api/institutions/${institutionId}/activities/suggest?prompt=${prompt}`);
      setSuggestion(response.data);
      setPromptChanged(false);
      // trackWaitedForSuggestedActivity();
    } catch {
      setSuggestionRequest({ loading: false, error: true });
    } finally {
      setSuggestionRequest((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const generateNewExample = () => {
    let newIndex = Math.ceil(Math.random() * 4);
    while (newIndex === exampleIndex) {
      newIndex = Math.ceil(Math.random() * 4);
    }
    setExampleIndex(newIndex);
  }

  const handleCreateExperience = async () => {
    // trackEditSuggestedActivity();
    const splittedPath = router.asPath.split('?');
    const path = `${splittedPath[0]}/new?description=${suggestion}&${splittedPath.length > 1 && splittedPath[1]}`;
    router.push(path);
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpenModal}
      >
        Ayúdame a crear una experiencia
      </Button>
      <Dialog
        fullScreen={smUp ? false : true}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>
          <Stack alignItems="flex-end">
            <IconButton color="error" onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography><b>Escribe lo que quieres trabajar o los materiales que tengas</b></Typography>
          <Typography variant="body2" color="GrayText">Por ejemplo: {PROMPT_EXAMPLES[exampleIndex]}</Typography>
          <Button onClick={generateNewExample} size="small" sx={{ pl: 0, mb: 2 }}>Mostrar otro ejemplo</Button>
          <TextField
            fullWidth
            multiline
            rows={5}
            onChange={handlePromptChange}
          />
          {suggestion && (
            <Stack>
              <Typography mt={4} gutterBottom><b>Sugerencia</b></Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{suggestion}</Typography>
              <Typography variant="caption" color="GrayText" align="right">Potenciado por OpenAI</Typography>
            </Stack>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 0 }} mt={2} justifyContent="space-between">
            <Stack alignItems="flex-start">
              <LoadingButton
                fullWidth={smUp ? false : true}
                onClick={handleSuggestionRequest}
                loading={suggestionRequest.loading}
                variant={suggestion ? 'outlined' : 'contained'}
                disabled={!Boolean(prompt)}
              >
                {promptChanged ? 'Sugerir experiencia' : 'Sugerir otra experiencia'}
              </LoadingButton>
              {suggestionRequest.loading && (
                <Typography variant="caption" mt={1} sx={(theme) => ({ color: theme.palette.info.main })}>
                  Estamos generando la experiencia, esto puede tardar algunos segundos.
                </Typography>
              )}
            </Stack>
            {suggestion && (
              <Button
                variant="contained"
                onClick={handleCreateExperience}
              >
                Crear experiencia basada en la sugerencia
              </Button>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}