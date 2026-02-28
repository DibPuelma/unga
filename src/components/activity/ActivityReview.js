import { mutate } from "swr";
import { Cancel, Check } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Rating, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";

const RATING_TO_FOLLOW_UP_QUESTION = {
  1: '¿Qué fue lo que hizo que resultara tan mal?',
  2: '¿Qué fue lo que hizo que resultara tan mal?',
  3: '¿Qué se podría mejorar?',
  4: '¿Qué se podría mejorar?',
  5: '¿Qué fue lo que hizo que resultara tan bien?',
}

export default function ActivityReview({ activity, onClose, refetchPath }) {
  const { trackReviewActivity } = useContext(MixpanelContext);
  const [rating, setRating] = useState(0)
  const [answer, setAnswer] = useState('');
  const [request, setRequest] = useState({
    loading: false,
    success: false,
    error: false,
  })

  const handleAnswerChange = ({ target: { value } }) => setAnswer(value);

  const handleSendReview = async () => {
    setRequest((oldValue) => ({ ...oldValue, loading: true }))
    try {
    await axios.post(`/api/activities/${activity.id}/activity-reviews`, {
      rating,
      answer,
      question: RATING_TO_FOLLOW_UP_QUESTION[rating],
    });
    setRequest((oldValue) => ({ ...oldValue, success: true }))
    // trackReviewActivity({
    //   name: activity.name,
    //   isPublic: activity.publiclyAvailable,
    //   isFromCommunity: activity.openToCommunity,
    // });
    refetchPath && mutate(refetchPath);
  } catch (error) {
    setRequest((oldValue) => ({ ...oldValue, error: true }))
  } finally {
    setRequest((oldValue) => ({ ...oldValue, loading: false }))
  }
}

  if (request.success) return (
    <Stack alignItems="center" spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <Check color="success" />
        <Typography>Reseña creada con éxito</Typography>
      </Stack>
      <Button onClick={onClose} variant="contained">Aceptar</Button>
    </Stack>
  )

  if (request.error) return (
    <Stack alignItems="center" spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <Cancel color="error" />
        <Typography>Error al crear la reseña</Typography>
      </Stack>
      <Button onClick={() => setRequest({ error: false })} variant="contained">
        Intentar nuevamente
      </Button>
    </Stack>
  )

  return (
    <Stack rowGap={2}>
      <Stack rowGap={1}>
      <Typography variant="subtitle1" fontWeight="bold" mb={0}>Comparte tu experiencia para ayudar a otras</Typography>
        <Typography>¿Del 1 al 5, qué tan bien resultó esta experiencia?</Typography>
        <Rating
          name="simple-controlled"
          value={rating}
          onChange={(_, newValue) => {
            setRating(newValue);
          }}
        />
      </Stack>
      {rating > 0 && (
        <>
          <Stack rowGap={1}>
            <Typography>{RATING_TO_FOLLOW_UP_QUESTION[rating]}</Typography>
            <TextField
              multiline
              rows={3}
              value={answer}
              onChange={handleAnswerChange}
            />
          </Stack>
          <LoadingButton
            variant="contained"
            onClick={handleSendReview}
            loading={request.loading}
          >
            Enviar reseña
          </LoadingButton>
        </>
      )}
    </Stack>
  )
}