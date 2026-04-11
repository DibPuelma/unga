import { Alert, Box, Snackbar, Tab, Tabs } from "@mui/material";
import axios from "axios";
import Head from "next/head";
import { useContext, useMemo, useState } from "react";
import EmployeesConfiguration from "src/components/institution/configuration/tabs/Employees";
import GeneralConfiguration from "src/components/institution/configuration/tabs/General";
import ReportConfiguration from "src/components/institution/configuration/tabs/Report";
import { InstitutionConfigurationContext } from "src/context/InstitutionConfigurationContext";
import { UserContext } from "src/context/UserContext";
import ObjectivesConfiguration from "./tabs/Objectives";
import StudentsConfiguration from "./tabs/Students";
import { useRouter } from "next/router";
import SubObjectivesConfiguration from "./tabs/SubObjectives";
import ObjectivesTreeConfiguration from "./tabs/ObjectivesTree";

export default function ConfigureInstitutionContainer() {
  const router = useRouter();
  const {
    institutionId,
    user,
  } = useContext(InstitutionConfigurationContext);
  const { setInstitution } = useContext(UserContext);
  const [tabValue, setTabValue] = useState(router.query?.tab ? parseInt(router.query.tab, 10) : 0);

  const canConfigureEmployees = useMemo(() =>
    user.role === 'principal',
    [user]
  )

  const canConfigureStudents = useMemo(() => true, [])


  const INITIAL_SAVE_ACTIONS = {
    success: false,
    loading: false,
    error: false,
  };
  const [saveActions, setSaveAction] = useState(INITIAL_SAVE_ACTIONS)

  const handleSnackbarClose = () => setSaveAction(INITIAL_SAVE_ACTIONS);

  const handleSave = async ({ body, internalSave }) => {
    setSaveAction({ success: false, loading: true, error: false });
    try {
      if (internalSave) await internalSave();
      if (body) {
        const response = await axios.patch(`/api/institutions/${institutionId}`, body);
        setInstitution(response.data);
      }
      setSaveAction((oldValue) => ({ ...oldValue, success: true }));
    } catch (e) {
      console.error(e);
      setSaveAction((oldValue) => ({ ...oldValue, error: true }));
    } finally {
      setSaveAction((oldValue) => ({ ...oldValue, loading: false }));
    }
  }

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Head><title>Configuración del centro</title></Head>
      <Box sx={{ pb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="Tabs de configuración"
            variant="scrollable"
          >
            <Tab label="General" />
            <Tab label="Informe" />
            <Tab
              label="Docentes"
              disabled={!canConfigureEmployees}
              sx={{
                display: canConfigureEmployees ? 'inherit' : 'none'
              }}
            />
            <Tab label="Indicadores de informe" />
            <Tab label="Indicadores de evaluación" />
            <Tab
              label="Árbol de objetivos"
              disabled={!canConfigureEmployees}
              sx={{
                display: canConfigureEmployees ? 'inherit' : 'none'
              }}
            />
            <Tab
              label="Párvulos"
              disabled={!canConfigureStudents}
              sx={{
                display: canConfigureStudents ? 'inherit' : 'none'
              }}
            />
          </Tabs>
        </Box>
        <Box p={2}>
          {tabValue === 0 && (
            <GeneralConfiguration
              onSave={handleSave}
              loading={saveActions.loading}
            />
          )}
          {tabValue === 1 && (
            <ReportConfiguration
              onSave={handleSave}
              loading={saveActions.loading}
            />
          )}
          {tabValue === 2 && (
            <EmployeesConfiguration
              onSave={handleSave}
              loading={saveActions.loading}
            />
          )}
          {tabValue === 3 && (
            <ObjectivesConfiguration />
          )}
          {tabValue === 4 && (
            <SubObjectivesConfiguration />
          )}
          {tabValue === 5 && (
            <ObjectivesTreeConfiguration />
          )}
          {tabValue === 6 && (
            <StudentsConfiguration />
          )}
        </Box>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={saveActions.success}
        onClose={handleSnackbarClose}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Cambios guardados con éxito
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={saveActions.error}
        onClose={handleSnackbarClose}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          No pudimos guardar los cambios
        </Alert>
      </Snackbar>
    </Box>
  )
}