import { SaveOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, List, ListItem, ListItemText, MenuItem, Stack, Typography } from "@mui/material";
import { useContext, useState } from "react";
import UngaSelect from "src/components/utils/UngaSelect";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";

const EVALUATION_TYPES = ['SUB_OBJECTIVES', 'OBJECTIVES', 'BOTH'];
const EVALUATION_TYPES_TO_LABELS = {
  SUB_OBJECTIVES: 'Indicadores de evaluación',
  OBJECTIVES: 'Indicadores de informe',
  BOTH: 'Ambos',
}

export default function ActivitiesConfiguration({
  loading,
  onSave,
}) {
  const { activitiesConfig, setActivitiesConfig } = useContext(InstitutionConfigurationContext);
  const handleChange = ({ target: { value } }) => {
    setActivitiesConfig((oldValue) => ({ ...oldValue, evaluationType: value }));
  }

  const handleInternalSave = () => {
    const body = { configuration: { activities: activitiesConfig } };
    onSave({ body });
  }

  return (
    <>
      <Box mb={3}>
        <Typography variant="subtitle1" mt={1} mb={2} fontWeight={500}>
          Configuración de experiencias de aprendizaje
        </Typography>
        <Stack spacing={4}>
          <Stack
            spacing={1}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            >
            <Typography variant="body2">
              ¿Qué vas a evaluar en las experiencias de aprendizaje?
            </Typography>
            <UngaSelect
              sx={{ minWidth: '13rem' }}
              value={activitiesConfig.evaluationType}
              onChange={handleChange}
              options={EVALUATION_TYPES}
              renderValue={null}
              mapFunction={(value) => (
                <MenuItem value={value} key={value}>
                  {EVALUATION_TYPES_TO_LABELS[value]}
                </MenuItem>
              )}
            />
          </Stack>
          <Box display="flex">
            <LoadingButton
              sx={{ width: { xs: '100%', sm: 'inherit' } }}
              loading={loading}
              loadingPosition="start"
              variant="contained"
              onClick={handleInternalSave}
              startIcon={<SaveOutlined />}
            >
              Guardar cambios
            </LoadingButton>
          </Box>
        </Stack>
      </Box>
    </>
  )
}