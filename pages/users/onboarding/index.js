import { LoadingButton } from "@mui/lab";
import { Chip, Stack, Typography } from "@mui/material";
import axios from "axios";
import { getNonHeterogeneousLevels } from "db/level";
import { useRouter } from "next/router";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { useContext, useState } from "react";
import { isAuthorized } from "services/Authorization";
import { UserContext } from "src/context/UserContext";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;
  const levels = await getNonHeterogeneousLevels();
  const { user } = await getServerSession(context.req, context.res, authOptions);

  // Already provisioned: onboarding is done, go home.
  if ((user.institution?.id || user.institutionId) && user.classrooms?.length > 0) {
    return { redirect: { permanent: false, destination: '/' } };
  }

  return {
    props: serializeForNextProps({
      user,
      levels,
    }),
  };
}

// Single-question onboarding: pick levels → auto-provision personal space →
// straight into the first AI experience.
export default function Onboarding({ user, levels }) {
  const router = useRouter();
  const { setInstitution: setContextInstitution } = useContext(UserContext);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLevel = (levelId) => {
    setSelectedLevels((current) => (
      current.includes(levelId)
        ? current.filter((id) => id !== levelId)
        : [...current, levelId]
    ));
  };

  const handleStart = async () => {
    if (selectedLevels.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`/api/users/${user.id}/quick-setup`, {
        levelIds: selectedLevels,
      });
      setContextInstitution(data.institution);
      router.replace(`/institutions/${data.institution.id}/activities/create?first=1`);
    } catch (e) {
      if (e.response?.status === 409) {
        router.replace('/');
        return;
      }
      setError('Algo salió mal, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <Stack justifyContent="center" minHeight="100vh" px={2} maxWidth={560} mx="auto" spacing={3}>
      <Typography
        variant="h4"
        textAlign="center"
        sx={(theme) => ({ color: theme.palette.primary.main })}
      >
        ¡Bienvenida {user.firstName?.split(' ')[0]}!
      </Typography>
      <Typography variant="h6" textAlign="center">
        ¿Con qué edades trabajas?
      </Typography>
      <Typography variant="body2" textAlign="center" color="text.secondary">
        Puedes elegir más de un nivel. Esto nos permite sugerirte experiencias adecuadas.
      </Typography>
      <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>
        {levels.map((level) => (
          <Chip
            key={level.id}
            label={level.name}
            color={selectedLevels.includes(level.id) ? 'primary' : 'default'}
            variant={selectedLevels.includes(level.id) ? 'filled' : 'outlined'}
            onClick={() => toggleLevel(level.id)}
            sx={{ fontSize: 15, py: 2.2 }}
          />
        ))}
      </Stack>
      {error && (
        <Typography variant="caption" color="error" textAlign="center">{error}</Typography>
      )}
      <LoadingButton
        variant="contained"
        size="large"
        onClick={handleStart}
        loading={loading}
        disabled={selectedLevels.length === 0}
      >
        Comenzar
      </LoadingButton>
    </Stack>
  );
}
