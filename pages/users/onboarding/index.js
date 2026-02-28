import { LoadingButton } from "@mui/lab";
import { Box, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import { getClassesByInstitution } from "db/class";
import { getNonHeterogeneousLevels } from "db/level";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { useContext, useEffect, useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import { MixpanelContext } from "services/MixpanelContext";
import OnboardingDialog from "src/components/onboarding/Dialog";
import PlanSelect from "src/components/plan/PlanSelect";
import UngaSelect from "src/components/utils/UngaSelect";
import { getEditAccessClassrooms, serializeForNextProps } from "src/helpers/businessLogic";
import { UserContext } from "src/context/UserContext";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;
  const levels = await getNonHeterogeneousLevels();
  const { user } = await getServerSession(context.req, context.res, authOptions);
  const institutionId = user.institution?.id || user.institutionId;
  const classrooms = institutionId ? await getClassesByInstitution(institutionId) : [];
  const allowedClassrooms = getEditAccessClassrooms(user, classrooms);

  return {
    props: serializeForNextProps({
      user,
      levels,
      allowedClassrooms,
    }),
  };
}

export default function Onboarding({
  user,
  levels,
  allowedClassrooms,
}) {
  const { setInstitution: setContextInstitution } = useContext(UserContext);
  const { trackChangeInstitution, trackCreateInstitution, trackOnboardingCreateClassrooms } = useContext(MixpanelContext);
  const [institution, setInstitution] = useState('');
  const [institutionId, setInstitutionId] = useState(user.institution?.id || user.institutionId || null);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [classrooms, setClassrooms] = useState(allowedClassrooms ? allowedClassrooms : []);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const fullSelectedLevels = useMemo(() =>
    levels.filter((level) => selectedLevels.includes(level.ref?.id || level.id)),
    [selectedLevels]
  );

  useEffect(() => {
    if (classrooms.length > 0 && institutionId) {
      setStep(2);
    } else if (institutionId) {
      setStep(1);
    } else {
      setStep(0);
    }
  }, [])

  const handleInstitutionChange = ({ target: { value } }) => {
    setInstitution(value);
  }

  const handleLevelsSelectChange = ({ target: { value } }) => {
    // On autofill we get a stringified value.
    setSelectedLevels(typeof value === 'string' ? value.split(',') : value);
  };

  const handleCreateInstitution = async () => {
    if (!institution) {
      return;
    }

    setLoading(true);
    try {
      const institutionResponse = await axios.post('/api/institutions', {
        name: institution
      });
      setContextInstitution(institutionResponse.data);
      const newInstitutionId = institutionResponse.data.id
      setInstitutionId(newInstitutionId);
      await axios.patch(`/api/users/${user.id}`, {
        institution: newInstitutionId,
      })
      // trackChangeInstitution(institution);
      // trackCreateInstitution(institution);
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateClassrooms = async () => {
    if (selectedLevels.length <= 0) {
      return;
    }

    setLoading(true);
    const promises = [];
    fullSelectedLevels.forEach((level) => {
      promises.push(
        axios.post('/api/classrooms', {
          name: level.name,
          level: level.id,
          mainTeacher: user.id,
          institution: institutionId,
        })
      );
    })
    try {
      const classroomsResponses = await Promise.all(promises);
      const newClassrooms = classroomsResponses.map((response) => response.data);
      await axios.patch(`/api/users/${user.id}`, {
        classrooms: newClassrooms.map((classroom) => classroom.id)
      })
      // trackOnboardingCreateClassrooms();
      setClassrooms(newClassrooms);
      setStep(2);
    } catch {
      setLoading(false);
    }
  }

  const WelcomeMessage = (
    <>
      <Typography
        variant="h4"
        textAlign="center"
        sx={(theme) => ({ color: theme.palette.primary.main })}
      >
        ¡Bienvenida {user.firstName.split(' ')[0]}!
      </Typography>
      <Typography variant="h6" textAlign="center" mb={4}>Estamos muy contentos de tenerte aquí 😊🎉</Typography>
    </>
  );

  return (
    <>

      {step === 0 && (
        <Stack justifyContent="center" height="100vh" px={1}>
          {WelcomeMessage}
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>¿Cómo se llama el establecimiento en el que trabajas?</Typography>
            <TextField
              fullWidth
              size="small"
              onChange={handleInstitutionChange}
              value={institution}
            />
          </Box>
          <Stack alignItems={{ xs: 'inherit', sm: 'flex-end' }}>
            <LoadingButton
              variant="contained"
              onClick={handleCreateInstitution}
              loading={loading}
            >
              Siguiente
            </LoadingButton>
          </Stack>
        </Stack>
      )}
      {step === 1 && (
        <Stack justifyContent="center" height="100vh" px={1}>
          {WelcomeMessage}
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>¿En qué niveles trabajas?</Typography>
            <UngaSelect
              fullWidth
              maxWidth="100%"
              id="select-recommended-level"
              multiple
              value={selectedLevels}
              onChange={handleLevelsSelectChange}
              options={levels}
            />
          </Box>
          <Stack alignItems={{ xs: 'inherit', sm: 'flex-end' }}>
            <LoadingButton
              variant="contained"
              onClick={handleCreateClassrooms}
              loading={loading}
            >
              Siguiente
            </LoadingButton>
          </Stack>
        </Stack>
      )}
      {step === 2 && (
        <Stack px={1} py={4}>
          <Typography
            variant="h4"
            textAlign="center"
            mb={2}
            sx={(theme) => ({ color: theme.palette.primary.main })}
          >
            Elige tu plan
          </Typography>
          <Typography textAlign="center" variant="h6" color="black" gutterBottom><b>Luego de elegir tu plan, tienes 7 días de prueba gratis</b></Typography>
          <Typography textAlign="center" variant="h6" gutterBottom mb={4}>Te enviaremos un correo 2 días antes del primer cobro por si quieres cancelar tu suscripción</Typography>
          <PlanSelect />
        </Stack>
      )}
      <OnboardingDialog open={!institutionId} />
    </>
  );
}