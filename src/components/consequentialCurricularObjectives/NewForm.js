import { Alert, Button, Snackbar, Stack, TextField, Typography } from "@mui/material";
import UngaSelectObjectives from "../utils/UngaSelectObjectives";
import { useState } from "react";
import { LoadingButton } from "@mui/lab";
import UngaSelect from "../utils/UngaSelect";
import axios from "axios";

export default function AddNewConsequentialCurricularObjective({
  specificCurricularObjectives,
  transversalCurricularObjectives,
  onCreate,
  onClose,
  institutionId
}) {
  const [consequentialCurricularObjective, setConsequentialCurricularObjective] = useState('');
  const [selectedTransversalCurricularObjectives, setSelectedTransversalCurricularObjectives] = useState([]);
  const [selectedSpecificCurricularObjectives, setSelectedSpecificCurricularObjectives] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [formErrors, setFormErrors] = useState(false);

  const handleCreate = async () => {
    if (selectedTransversalCurricularObjectives.length === 0 || selectedSpecificCurricularObjectives.length === 0) {
      setFormErrors(true);
      return;
    }
    
    setCreateLoading(true);
    try {
      const newConsequentialCurricularObjective = await axios.post(`/api/institutions/${institutionId}/consequential-curricular-objectives`, {
        name: consequentialCurricularObjective,
        transversalCurricularObjectives: selectedTransversalCurricularObjectives,
        specificCurricularObjectives: selectedSpecificCurricularObjectives,
      })
      onCreate(newConsequentialCurricularObjective.data)
      onClose();
    } catch {
      setCreateError(true);
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Stack width="100%">
      <Typography variant="h6" mb={3}>Nuevo Objetivo Específico</Typography>
      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          value={consequentialCurricularObjective}
          onChange={({ target: { value } }) => setConsequentialCurricularObjective(value)}
          label="Nombre del objetivo específico"
          error={formErrors && !Boolean(consequentialCurricularObjective)}
          helperText={formErrors && !Boolean(consequentialCurricularObjective) && "El objetivo específico debe tener un nombre"}
        />
        <UngaSelect
          fullWidth
          multiple
          maxWidth={650}
          label="OAT relacionados"
          labelId="select-filter-OAT-label"
          name="OAT"
          id="select-filter-OAT"
          value={selectedTransversalCurricularObjectives}
          onChange={({ target: { value } }) => setSelectedTransversalCurricularObjectives(value)}
          options={transversalCurricularObjectives}
          error={formErrors && selectedTransversalCurricularObjectives.length === 0}
          errorText={"Debes seleccionar al menos un OAT"}
        />
        <UngaSelect
          fullWidth
          multiple
          maxWidth={650}
          label="OA relacionados"
          labelId="select-filter-OA-label"
          name="OA"
          id="select-filter-OA"
          value={selectedSpecificCurricularObjectives}
          onChange={({ target: { value } }) => setSelectedSpecificCurricularObjectives(value)}
          options={specificCurricularObjectives}
          error={formErrors && selectedSpecificCurricularObjectives.length === 0}
          errorText={"Debes seleccionar al menos un OA"}
        />
        <Stack direction="row" spacing={2} justifyContent="space-between">
          {onClose && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={onClose}
            >
              Cancelar
            </Button>
          )}
          <LoadingButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreate}
            loading={createLoading}
          >
            Crear
          </LoadingButton>
        </Stack>
      </Stack>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={createError}
        onClose={() => setCreateError(false)}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setCreateError(false)} severity="error" sx={{ width: '100%' }}>
          No se pudo crear el objetivo específico
        </Alert>
      </Snackbar>
    </Stack>
  )
}