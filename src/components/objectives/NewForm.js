import { LoadingButton } from "@mui/lab";
import { Alert, Button, Snackbar, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import { UserContext } from "src/context/UserContext";
import UngaSelect from "../utils/UngaSelect";

export default function NewObjectiveForm({
  onClose,
  availableCores,
  onCreate,
  availableClassrooms,
}) {
  const { query: { classroomId } } = useRouter();
  const { trackCreateObjective } = useContext(MixpanelContext);
  const { institution } = useContext(UserContext);
  const calculatedClassroomId = useMemo(() => (
    classroomId ? classroomId : availableClassrooms[0].id
  ), [classroomId, availableClassrooms])
  const [data, setData] = useState({
    subObjective: '',
    objective: '',
    core: availableCores.length === 1 ? availableCores[0].id : '',
    classrooms: [calculatedClassroomId],
  })
  const [formErrors, setFormErrors] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const { objective, core, classrooms } = data;

  const handleSetData = (key, value) => setData((oldValue) => ({ ...oldValue, [key]: value }));

  const handleSelectChange = ({ target: { name, value } }) => handleSetData(name, value);

  const handleObjectiveChange = ({ target: { value } }) => {
    handleSetData('objective', value);
  }

  const createObjective = async () => {
    const response = await axios.post(`/api/institutions/${institution.id}/objectives`, {
      coreId: core,
      classroomsIds: classrooms,
      name: objective,
    });

    // trackCreateObjective({
    //   name: response.data.name,
    //   core: response.data.core.name,
    // });
    return response.data;
  }

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      if (!objective || !core || classrooms.length === 0) {
        setFormErrors(true);
        setCreateLoading(false);
        return;
      }
      const createdObjective = await createObjective();
      onCreate(createdObjective);
    } catch {
      setCreateError(true)
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Stack>
      <Typography variant="h6" mb={3}>Nuevo indicador para el informe</Typography>
      <Stack spacing={2}>
        <>
          <TextField
            size="small"
            value={objective}
            onChange={handleObjectiveChange}
            label="Nombre del nuevo indicador"
            error={formErrors && !Boolean(objective)}
            helperText={formErrors && !Boolean(objective) && "Debes nombrar el nuevo indicador del informe"}
            autoFocus
          />
          <UngaSelect
            fullWidth
            error={formErrors && !Boolean(core)}
            label="Núcleo de aprendizaje"
            labelId="select-related-core-label"
            name="core"
            id="select-related-core"
            value={core}
            onChange={handleSelectChange}
            options={availableCores}
            errorText="Escoge el núcleo de aprendizaje"
          />
          <UngaSelect
            fullWidth
            multiple
            error={formErrors && classrooms.length === 0}
            label="Sala o salas"
            labelId="select-classrooms-label"
            name="classrooms"
            id="select-classrooms"
            value={classrooms}
            onChange={handleSelectChange}
            options={availableClassrooms}
            errorText="Escoge al menos una sala"
          />
        </>
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