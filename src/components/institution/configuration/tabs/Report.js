import { SaveOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, List, ListItem, ListItemText, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useState } from "react";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import { UserContext } from "src/context/UserContext";

const SIGNER_LABELS = {
  teacher: 'educadora',
  coordinator: 'coordinadora',
  principal: 'directora',
  parent: 'apoderado',
}

export default function ReportConfiguration({
  onSave,
  loading,
}) {
  const { levelsOfAchievement, setLevelsOfAchievement } = useContext(UserContext);
  const { reportConfig, setReportConfig, employeesRolesConfig, user } = useContext(InstitutionConfigurationContext)

  const [stateLevelsOfAchievement, setStateLevelsOfAchievement] = useState([...levelsOfAchievement]);
  const [levelOfAchievementUpdated, setLevelOfAchievementUpdated] = useState(false);

  const handleSignerConfigChange = (signer) => {
    setReportConfig((oldValue) => ({
      ...oldValue,
      signers: {
        ...oldValue.signers,
        [signer]: !oldValue.signers[signer]
      } 
    }));
  };

  const handleShowLevelOfAchievementDescriptionChange = () => (
    setReportConfig((oldValue) => ({
      ...oldValue,
      showLevelOfAchievementDescription: !oldValue.showLevelOfAchievementDescription
    }))
  );

  const handleLoaDescription = ({ target: { value } }, i) => {
    const newLoas = [...stateLevelsOfAchievement];
    newLoas[i].description = value;
    setStateLevelsOfAchievement(newLoas);
    setLevelOfAchievementUpdated(true);
  }

  const updateLevelsOfAchievement = async () => {
    await axios.put('/api/level-of-achievement', { levelsOfAchievement: stateLevelsOfAchievement });
    setLevelsOfAchievement(stateLevelsOfAchievement);
  }

  const handleInternalSave = async () => {
    const body = {
      configuration: {
        report: reportConfig,
      }
    }
    if (levelOfAchievementUpdated) {
      onSave({ body, internalSave: updateLevelsOfAchievement });
    } else {
      onSave({ body });
    }
  }

  return (
    <>
      <Box mb={3}>
        <Typography variant="subtitle1" mt={2} fontWeight={500}>Firmas</Typography>
        <List>
          {Object.entries(reportConfig.signers)
            .filter(([signer, _]) => (
              user.role !== 'teacher' || (signer !== 'coordinator' && signer !== 'principal')
            ))
            .map(([signer, value]) => {
            const noCoordinator = signer === 'coordinator' &&
              (!employeesRolesConfig.coordinator || employeesRolesConfig.coordinator === 'empty');
            return (
              <ListItem dense disableGutters key={signer} secondaryAction={
                <Switch
                  checked={value}
                  onClick={() => handleSignerConfigChange(signer)}
                  disabled={noCoordinator}
                />
              }>
                <ListItemText
                  sx={{ mr: 2 }}
                  primary={`Mostrar firma ${SIGNER_LABELS[signer]}`}
                  secondary={noCoordinator && 'Debes elegir una coordinadora para mostrar su firma en el informe'}
                />
              </ListItem>
            )
          })}
        </List>
      </Box>
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight={500}>Niveles de logro</Typography>
        <ListItem dense disableGutters secondaryAction={
          <Switch
            checked={reportConfig.showLevelOfAchievementDescription}
            onClick={handleShowLevelOfAchievementDescriptionChange}
          />
        }>
          <ListItemText
            sx={{ mr: 2 }}
            primary="Mostrar descripciones"
          />
        </ListItem>
        {reportConfig.showLevelOfAchievementDescription && (
          <Stack mt={1}>
            {stateLevelsOfAchievement.map((loa, i) => (
              <Stack mb={2} key={loa.id}>
                <Typography variant="body2">{loa.name}</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  InputProps={{
                    sx: (theme) => ({ fontSize: theme.typography.body2 })
                  }}
                  value={loa.description}
                  onChange={(e) => handleLoaDescription(e, i)}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
      <Box display="flex" justifyContent="flex-end">
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
    </>
  )
}