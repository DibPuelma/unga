import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import axios from 'axios';
import moment from 'moment-timezone';
import { UserContext } from 'src/context/UserContext';
import { getSession } from 'next-auth/react';

export default function PMFDialog() {
  const { institution } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [pmfAnswer, setPmfAnswer] = useState(null);
  const [emptyField, setEmptyField] = useState(false);
  const [formData, setFormData] = useState({
    dissapointment: '',
    why: '',
    improvements: '',
  });

  useEffect(() => {
    const getPmfData = async () => {
      const session = await getSession();
      if (!session || !session.user) return;
      if (session.user.createdAt) {
        const createdMoreThanTwoWeeksAgo = moment(session.user.createdAt)
          .isBefore(moment().subtract(2, 'weeks'));
        if (!createdMoreThanTwoWeeksAgo) return;
      }

      const pmfResponse = await axios.get('/api/pmf-answers');
      if (!pmfResponse) return;
      
      const { data: dbPmfAnswer } = pmfResponse
      
      setPmfAnswer(dbPmfAnswer);
      if (!dbPmfAnswer) {
        setOpen(true);
      }
      else if (moment(dbPmfAnswer.askAgainDate).isBefore(moment())) {
        setOpen(true);
      }
    }

    getPmfData();
  }, [])

  const handleSnooze = () => {
    if (pmfAnswer && !pmfAnswer.dissapointment) {
      axios.patch(`/api/pmf-answers/${pmfAnswer.id}`, {
        askAgainDate: moment().add(2, 'days').format('YYYY-MM-DD'),
        snoozeCount: pmfAnswer.snoozeCount ? pmfAnswer.snoozeCount + 1 : 1,
      });
    } else {
      axios.post('/api/pmf-answers', {
        askAgainDate: moment().add(2, 'days').format('YYYY-MM-DD'),
        snoozeCount: 1,
      });
    }
    setOpen(false);
  }

  const handleConfirm = () => {
    setEmptyField(false);
    if (!formData.dissapointment || !formData.why || !formData.improvements) {
      setEmptyField(true);
      return;
    }
    if (pmfAnswer && !pmfAnswer.dissapointment) {
      axios.patch(`/api/pmf-answers/${pmfAnswer.id}`, {
        ...formData,
        askAgainDate: moment().add(2, 'months').format('YYYY-MM-DD'),
      });
    }
    else {
      axios.post('/api/pmf-answers', {
        ...formData,
        askAgainDate: moment().add(1, 'month').format('YYYY-MM-DD'),
      });
    }
    setOpen(false);
  }

  const handleFormChange = ({ target: { name, value } }) => {
    setFormData((oldValue) => ({ ...oldValue, [name]: value }));
  }

  const mainQuestion = '¿Qué tan decepcionada estarías si Unga ya no existiera?';

  return (
    <Dialog
      open={open}
      onClose={handleSnooze}
      fullWidth
      maxWidth="xs"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>Por favor contesta estas 3 preguntas</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography>{mainQuestion}</Typography>
          <RadioGroup
            row
            aria-labelledby="dissapointment-radio-button-group-label"
            name="dissapointment"
            value={formData.dissapointment}
            onChange={handleFormChange}
          >
            <FormControlLabel value="notDissapointed" control={<Radio size="small" />} label="No estaría nada decepcionada" />
            <FormControlLabel value="somewhatDissapointed" control={<Radio size="small" />} label="Estaría algo decepcionada" />
            <FormControlLabel value="veryDissapointed" control={<Radio size="small" />} label="Estaría muy decepcionada" />
          </RadioGroup>
          {Boolean(!formData.dissapointment) && emptyField && (
          <Typography variant="caption" color="error" ml={2}>
            Por favor contesta esta pregunta
          </Typography>
          )}
        </Box>
        <Box mb={2}>
          <Typography gutterBottom>¿Por qué?</Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            name="why"
            value={formData.why}
            error={Boolean(!formData.why) && emptyField}
            helperText={Boolean(!formData.why) && emptyField && 'Por favor contesta esta pregunta'}
            onChange={handleFormChange}
          />
        </Box>
        <Box mb={2}>
          <Typography gutterBottom>¿Qué podríamos mejorar para ti?</Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            name="improvements"
            value={formData.improvements}
            error={Boolean(!formData.improvements) && emptyField}
            helperText={Boolean(!formData.improvements) && emptyField && 'Por favor contesta esta pregunta'}
            onChange={handleFormChange}
          />
        </Box>
        <Stack mb={2} direction="row" spacing={2}>
          <Button
            fullWidth
            onClick={handleSnooze}
          >
            Recordarme más tarde
          </Button>
          <Button
            fullWidth
            onClick={handleConfirm}
            variant="contained"
          >
            Enviar respuestas
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}