import { Box, Button, Card, Divider, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import Link from "src/Link";
import { UserContext } from "src/context/UserContext";
import ActivitiesLibraryModal from "../activity/LibraryModal";

export default function PlanCard({ plan }) {
  const router = useRouter();
  const { trackSelectPlan, trackOnboardingOpenLibraryModal } = useContext(MixpanelContext);
  const { user, user: { plan: currentPlan, selectedFreeTrialPlan } } = useContext(UserContext);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  const handleSelectPlan = () => {
    // trackSelectPlan(plan.id);
    router.replace(plan.link);
  }

  const handleOpenLibraryModal = () => {
    // trackOnboardingOpenLibraryModal();
    setLibraryModalOpen(true);
  }

  const getButton = () => {
    if (currentPlan === 'trial' && !selectedFreeTrialPlan) {
      return (
        <Stack spacing={2}>
          <Button
            onClick={handleSelectPlan}
            fullWidth
            variant="contained"
            color="primary"
          >
            Elegir este plan
          </Button>
          {/* <Button
            onClick={handleOpenLibraryModal}
            fullWidth
            variant="outlined"
            color="primary"
          >
            Revisar biblioteca de experiencias
          </Button> */}
        </Stack>
      )
    } else {
      if (currentPlan === plan.id || selectedFreeTrialPlan === plan.id) {
        return (
          <Link
            href={`https://wa.me/447543814676?text=Quiero cancelar mi suscripción a Unga, mi correo es ${user.email}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              fullWidth
              variant="outlined"
              color="error"
            >
              Cancelar mi suscripción
            </Button>
          </Link>
        )
      } else {
        return (
          <Link
            href={`https://wa.me/447543814676?text=Quiero cambiar mi suscripción de unga al plan ${plan.name}. Mi correo es ${user.email}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              fullWidth
              variant="outlined"
              color="primary"
            >
              Cambiar a este plan
            </Button>
          </Link>
        )
      }
    }
  }
  return (
    <>
      <Card sx={{ px: 2, py: 4 }}>
        <Stack alignItems="center" spacing={1}>
          <Image src={plan.icon} alt={plan.name} width={75} height={75} />
          <Typography variant="h4">{plan.name}</Typography>
          <Typography variant="h6"><b>{plan.monthlyPrice} al mes</b></Typography>
          <Box width="90%">
            {getButton()}
          </Box>
        </Stack>
        <Divider sx={{ my: 4 }} />
        <Stack rowGap={2}>
          {plan.features.map((feature) => (
            <Typography key={feature}>· {feature}</Typography>
          ))}
        </Stack>
      </Card>
      <ActivitiesLibraryModal open={libraryModalOpen} onClose={() => setLibraryModalOpen(false)} />
    </>
  )
}