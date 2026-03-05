import { SaveOutlined, Upload } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, Stack, Typography } from "@mui/material";
import { useContext } from "react";
import CloudinaryUploadWidget from "src/components/utils/CloudinaryUploadWidget";
import UngaRatioImage from "src/components/utils/UngaRatioImage";
import UngaVerticalFormField from "src/components/utils/UngaVerticalFormField";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";

const CONFIGURABLE_DATA = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'address', label: 'Dirección', type: 'text' },
  { key: 'code', label: 'Código RBD', type: 'text' },
  { key: 'junjiCode', label: 'Código Junji', type: 'text'},
  { key: 'mobilePhone', label: 'Celular', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'webpage', label: 'Página web', type: 'text' },
];

export default function GeneralConfiguration({ onSave, loading }) {
  const {
    institutionFormData,
    setInstitutionFormData,
  } = useContext(InstitutionConfigurationContext);

  const handleDataChange = (event) => {
    const { target: { name, value } } = event;
    setInstitutionFormData((oldValue) => ({ ...oldValue, [name]: value }))
  }

  const handleLogoChange = (logoAsset) => {
    // Assets are an object.
    // This is a single input, therefore position 0 will always be the only asset uploaded
    const logo = Object.values(logoAsset)[0];
    handleDataChange({ target: { name: 'logo', value: logo } });
  }

  const hasLogoPreview = (logo) => {
    if (!logo) return false;
    if (typeof logo === 'string') return true;

    return !!(logo.url || logo.secure_url);
  };

  const handleSave = () => {
    const body = institutionFormData;

    onSave({ body });
  }

  return (
    <>
      <Stack mb={3} spacing={4}>
        <Box>
          <Typography variant="subtitle1" mb={1} fontWeight={500}>Datos de la institución</Typography>
          <Stack spacing={2} width={{ xs: '100%', sm: '50%' }}>
            <Stack alignItems="flex-start" spacing={1}>
              <Typography fontSize={14} gutterBottom>Logo</Typography>
              {hasLogoPreview(institutionFormData.logo) && (
                <UngaRatioImage image={institutionFormData.logo} />
              )}
              <CloudinaryUploadWidget
                buttonSx={{ width: { xs: '100%', sm: 'inherit' } }}
                buttonTitle={institutionFormData.logo ? 'Cambiar logo' : 'Subir logo'}
                buttonIcon={<Upload />}
                withoutShowcase
                onAssetChange={handleLogoChange}
                multiple={false}
              />
            </Stack>
            {CONFIGURABLE_DATA.map((field) => (
              <UngaVerticalFormField
                key={field.key}
                value={institutionFormData[field.key]}
                name={field.key}
                label={field.label}
                type={field.type}
                onChange={handleDataChange}
              />
            ))}
          </Stack>
        </Box>
        <Box display="flex">
          <LoadingButton
            sx={{ width: { xs: '100%', sm: 'inherit' } }}
            loading={loading}
            loadingPosition="start"
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveOutlined />}
          >
            Guardar cambios
          </LoadingButton>
        </Box>
      </Stack>
    </>
  )
}