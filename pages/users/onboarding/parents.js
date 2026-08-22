import { Button, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useState } from "react";
import { isAuthorized } from "services/Authorization";
import ParentsTranslationService from "services/translation/parents";
import ActivitiesLibraryModal from "src/components/activity/LibraryModal";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue, session] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;
  const { user } = session;

  return {
    props: serializeForNextProps({
      user,
    }),
  };
}

export default function ParentsOnboarding({ user }) {
  const router = useRouter();
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  const handleRegisterCard = () => {
    router.push('https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=2c93808488bed3690188c0f16cd700ab');
  }

  return (
    <Container maxWidth="sm">
      <Stack>
        <Typography
          variant="h4"
          sx={(theme) => ({ color: theme.palette.primary.main })}
          gutterBottom
        >
          ¡Hola {user.firstName.split(' ')[0]} 👋! Te damos la bienvenida a Unga.
        </Typography>
        <Typography variant="h6" mb={4}>
          Potenciemos el desarrollo de tus hijos
        </Typography>
        <Typography mb={2}>
          En la plataforma encontrarás actividades entretenidas y estimulantes para hacer con ellos, desde los 0 a los 6 años, la etapa más importante de su desarrollo.
        </Typography>
        <Typography mb={4}>
          Todas son diseñadas por expertas en educación y desarrollo infantil.
        </Typography>
        <Typography variant="h6" mb={2}>
          Las experiencias desarrollan habilidades en
        </Typography>
        <Stack spacing={1} mb={4}>
          {ParentsTranslationService.allCores.map((core) => (
            <Chip key={core} color="info" label={core} variant="outlined" />
          ))}
        </Stack>
        <Typography variant="h6" gutterBottom><b>Luego de registrar tu tarjeta, tienes 7 días gratis</b></Typography>
        <Typography mb={4}>Te enviaremos un correo 2 días antes del primer cobro por si quieres cancelar tu suscripción</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4} width="100%">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleRegisterCard}
          >
            Comenzar mi prueba gratuita
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="info"
            onClick={() => setLibraryModalOpen(true)}
          >
            Revisar ejemplos de actividades
          </Button>
        </Stack>
      </Stack>
      <ActivitiesLibraryModal forParents open={libraryModalOpen} onClose={() => setLibraryModalOpen(false)} />
    </Container>
  )
}