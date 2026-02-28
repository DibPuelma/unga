import { useContext, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { useRouter } from "next/router";
import axios from "axios";
import { Add } from "@mui/icons-material";
import { MixpanelContext } from "services/MixpanelContext";
import { UserContext } from "src/context/UserContext";
import useNoPlanWarning from "src/hooks/useNoPlanWarning";

export default function CreateObservationButton({ classroomId, studentId }) {
  const { userHasPlan, user } = useContext(UserContext);
  const { trackCreateObservation } = useContext(MixpanelContext);
  const handleOpenNoPlanWarning = useNoPlanWarning({
    title: '¡Ya creaste 5 observaciones!',
    description: 'Para poder crear más, debes comenzar tu prueba gratuita registrando un medio de pago',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleNewObservation = async () => {
    setLoading(true);
    if (!userHasPlan) {
      const observationsCountResponse = await axios.get(`/api/users/${user.id}/observations/count`);
      if (observationsCountResponse.data >= 5) {
        handleOpenNoPlanWarning();
        setLoading(false);
        return;
      }
    }
    try {
      const response = await axios.post(`/api/observations`, {
        classroom: classroomId,
        students: studentId ? [studentId] : [],
      })
      // trackCreateObservation();
      const observationId = response.data.id;
      if (observationId) {
        router.push(`/classes/${classroomId}/observations/${observationId}/edit`);
      } else {
        console.error('No observation ID in response:', response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating observation:', error);
      setLoading(false);
    }
  }
  return (
    <LoadingButton
      variant="contained"
      color="primary"
      startIcon={<Add />}
      onClick={handleNewObservation}
      loading={loading}
    >
      Nueva observación
    </LoadingButton>
  )
}