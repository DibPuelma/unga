import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import ObservationsList from './ObservationsList';

export default function ObservationSelectDialog({ handleClose, handleConfirm, open, observations }) {
  const [selectedObservations, setSelectedObservations] = useState([]);

  const handleSelectObservation = (checked, observation) => {
    let newSelectedObservations = [];
    if (checked) {
      newSelectedObservations = [...selectedObservations, observation];
    }
    else {
      newSelectedObservations = [...selectedObservations].filter(
        (obs) => obs.id !== observation.id
      );
    }
    setSelectedObservations(newSelectedObservations);
  }

  const handleConfirmSelection = () => {
    handleConfirm(selectedObservations);
    setSelectedObservations([]);
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Selecciona las observaciones que quieres agregar
      </DialogTitle>
      <DialogContent>
        <ObservationsList
          observations={observations}
          columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
          onSelect={handleSelectObservation}
          emptyText="No hay observaciones disponibles para este núcleo"
          noName
          noActions
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined" color="error">Cancelar</Button>
        <Button
          onClick={handleConfirmSelection}
          variant="contained"
          color="primary"
          disabled={observations.length === 0 || selectedObservations.length === 0}
        >
          Agregar observaciones
        </Button>
      </DialogActions>
    </Dialog>
  )
}