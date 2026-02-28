import React, { useMemo, useState } from 'react';
import { Box, Button, Dialog, Stack, Typography } from '@mui/material';
import ObservationsList from './ObservationsList';
import ObservationSelectDialog from './ObservationSelectDialog';

export default function FeaturedObservations({
  selectableObservations: propsSelectableObservations,
  featuredObservations: propsFeaturedObservations,
  handleObservationSelection,
}) {
  const [featuredObservations, setFeaturedObservations] = useState(propsFeaturedObservations || []);
  const [selectableObservations, setSelectabledObservations] = useState(propsSelectableObservations);
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const handleConfirmSelection = (observations) => {
    const newFeaturedObservations = [...featuredObservations, ...observations];
    const newFeaturedObservationsIds = newFeaturedObservations.map((observation) => observation.id);
    const newSelectableObservations = observations.filter((obs) => (
      !newFeaturedObservationsIds.includes(obs.id.toString())
    ))
    setFeaturedObservations(newFeaturedObservations);
    handleObservationSelection(newFeaturedObservations);
    setSelectabledObservations(newSelectableObservations);
    handleCloseDialog();
  }

  const handleRemove = (id) => {
    const newFeaturedObservations = [...featuredObservations].filter((observation) => observation.id !== id)
    const newSelectableObservations = [
      ...selectableObservations,
      featuredObservations.find((observation) => observation.id === id),
    ];
    setFeaturedObservations(newFeaturedObservations);
    handleObservationSelection(newFeaturedObservations);
    setSelectabledObservations(newSelectableObservations);
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle2">Observaciones destacadas</Typography>
          <Button variant="contained" size="small" onClick={handleOpenDialog}>
            Agregar observaciones
          </Button>
      </Stack>
      <Box>
        <ObservationsList
          observations={featuredObservations}
          emptyText="Si quieres agregar observaciones para este núcleo haz click en 'Agregar observaciones'"
          columns={1}
          noSearch
          onRemove={(id) => handleRemove(id)}
          report
        />
      </Box>
      <ObservationSelectDialog
        handleClose={handleCloseDialog}
        handleConfirm={handleConfirmSelection}
        observations={selectableObservations}
        open={openDialog}
      />
    </Box>
  )
}