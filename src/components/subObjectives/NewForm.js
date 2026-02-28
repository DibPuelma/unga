import { LoadingButton } from "@mui/lab";
import { Alert, Button, Snackbar, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useMemo, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import UngaSelectObjectives from "../utils/UngaSelectObjectives";
import CreateObjectiveLink from "../objectives/CreateObjectiveLink";
import { UserContext } from "src/context/UserContext";

export default function NewSubObjectiveForm({
  onClose,
  objectives,
  availableCores,
  availableLevelsIds,
  onCreate,
  direction = "column"
}) {
  const { institution: { id: institutionId } } = useContext(UserContext);
  const { trackCreateSubObjective } = useContext(MixpanelContext);
  const [data, setData] = useState({
    subObjective: '',
    objective: '',
  })
  const [formErrors, setFormErrors] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const { subObjective, objective } = data;

  const handleSetData = (key, value) => setData((oldValue) => ({ ...oldValue, [key]: value }));

  const handleSubObjectiveChange = ({ target: { value } }) => handleSetData('subObjective', value);

  const handleObjectiveChange = ({ target: { value } }) => {
    handleSetData('objective', value);
  }

  const createSubObjective = async (objectiveId) => {
    const response = await axios.post(`/api/institutions/${institutionId}/objectives/${objectiveId}/sub-objectives`, {
      name: subObjective,
    });

    // trackCreateSubObjective({
    //   name: response.data.name,
    //   core: response.data.core?.name,
    // });
    return response.data;
  }

  const handleCreate = async () => {
    setCreateLoading(true);
    if (
      (!subObjective || !objective)
    ) {
      setFormErrors(true);
      setCreateLoading(false);
      return;
    }
    try {
      const objectiveId = objective;
      // Error is handled in createObjective
      if (!objectiveId) return;

      const createdSubObjective = await createSubObjective(objectiveId);
      onCreate(createdSubObjective);
    } catch (e) {
      console.error(e);
      setCreateError(true)
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Stack width="100%">
      <Typography variant="h6" mb={3}>Nuevo indicador de evaluación</Typography>
      <Stack spacing={2} direction={direction}>
        <TextField
          fullWidth
          size="small"
          value={subObjective}
          onChange={handleSubObjectiveChange}
          label="Nombre del indicador de evaluación"
          error={formErrors && !Boolean(subObjective)}
          helperText={formErrors && !Boolean(subObjective) && "El indicador de evaluación debe tener un nombre"}
        />
        <UngaSelectObjectives
          fullWidth
          label="Indicador del informe relacionado"
          labelId="select-filter-objective-label"
          name="objective"
          id="select-filter-objective"
          value={objective}
          onChange={handleObjectiveChange}
          objectives={objectives}
          filteredCores={availableCores.map((core) => core.id)}
          filteredLevels={availableLevelsIds}
          error={formErrors && !Boolean(objective)}
          errorText={"Debes seleccionar o crear un objetivo del informe"}
          emptyValue={<CreateObjectiveLink />}
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
          No se pudo crear el indicador
        </Alert>
      </Snackbar>
    </Stack>
  )
}