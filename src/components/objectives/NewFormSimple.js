import { useContext, useEffect, useMemo, useState } from "react";
import { Button, CircularProgress, IconButton, Stack, TextField } from "@mui/material";
import axios from "axios";
import { MixpanelContext } from "services/MixpanelContext";
import { LoadingButton } from "@mui/lab";
import { useRouter } from "next/router";
import UngaSelect from "../utils/UngaSelect";
import { CloseOutlined, SaveOutlined } from "@mui/icons-material";

export default function NewFormSimple({
  onCreate,
  coreId,
  cores,
  classrooms,
  buttonLabel = 'Crear nuevo indicador para la sala',
  onCancel,
  creating: creatingProps,
  institutionId: propsInstitutionId,
}) {
  const { query: { classroomId, institutionId: pathInstitutionId } } = useRouter();
  const { trackCreateObjective } = useContext(MixpanelContext);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(creatingProps ?? false);
  const [loading, setLoading] = useState(false);
  const [selectedCoreId, setSelectedCoreId] = useState(coreId ?? '');
  const [selectedClassroomIds, setSelectedClassroomIds] = useState(classroomId ? [classroomId] : []);
  const institutionId = useMemo(() => propsInstitutionId ?? pathInstitutionId, [propsInstitutionId, pathInstitutionId])

  useEffect(() => setCreating(creatingProps), [creatingProps])
  useEffect(() => setSelectedCoreId(coreId ?? ''), [coreId])

  const handleNewObjectiveChange = ({ target: { value } }) => {
    setName(value);
  }

  const handleCreateObjective = async () => {
    if (!name) return;
    setLoading(true);
    let response = null;
    try {
      if (classroomId) {
        response = await axios.post(`/api/classrooms/${classroomId}/objectives`, {
          name,
          core: selectedCoreId,
        })
        await onCreate(response.data);
      } else if (institutionId && selectedClassroomIds.length > 0) {
        response = await axios.post(`/api/institutions/${institutionId}/objectives`,
          {
            name,
            coreId: selectedCoreId,
            classroomsIds: selectedClassroomIds,
          }
        )
        await onCreate(response.data);
      }
      if (response) {
        const { data: { data } } = response;

        // trackCreateObjective({
        //   name: data.name,
        //   core: data.core.data.name,
        // });
      }
      setName('');
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    setCreating(false)
    if (onCancel) onCancel();
  }

  return (
    <>
      {!creating ? (
        <Stack direction="row" sx={{ width: { xs: '100%', sm: 'inherit' } }} justifyContent="flex-end">
          <Button
            sx={{ width: { xs: '100%', sm: 'inherit' } }}
            variant="contained"
            onClick={() => setCreating(true)}
          >
            {buttonLabel}
          </Button>
        </Stack>
      ) : (
        <Stack
          width="100%"
          direction={!coreId && !classroomId ? 'column' : 'row'}
          spacing={{ xs: 2 }}
        >
          <Stack spacing={2} direction="row" width="100%">
            <TextField
              sx={{ flexGrow: 1 }}
              value={name}
              name="name"
              label="Nombre del nuevo indicador"
              variant="outlined"
              size="small"
              onChange={handleNewObjectiveChange}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {!coreId && (
              <UngaSelect
                options={cores}
                sx={{ minWidth: 250 }}
                value={selectedCoreId}
                onChange={({ target: { value } }) => setSelectedCoreId(value)}
                label="Seleccionar núcleo"
              />
            )}
            {!classroomId && (
              <UngaSelect
                multiple
                fullWidth
                options={classrooms}
                value={selectedClassroomIds}
                onChange={({ target: { value } }) => setSelectedClassroomIds(value)}
                label="Seleccionar salas"
              />
            )}
            <Stack direction="row" alignItems="center" justifyContent="flex-end">
              <IconButton
                color="error"
                onClick={handleCancel}
                disabled={loading}
              >
                <CloseOutlined />
              </IconButton>
              <IconButton onClick={handleCreateObjective} size="small" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={16} /> : <SaveOutlined fontSize='small' />}
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      )}
    </>
  )
}