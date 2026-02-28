import { CopyAll } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import { PlanningContext } from "src/context/PlanningContext";

export default function DuplicateActivityButton({ activityId, publiclyAvailable, openToCommunity, institutionId }) {
  const router = useRouter();
  const { trackDuplicatePublicActivity, trackDuplicateCommunityActivity } = useContext(MixpanelContext);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneRequest, setCloneRequest] = useState({
    error: false,
    loading: false,
  });

  const handleCloneActivity = async () => {
    setCloneRequest({ loading: true, error: false });
    try {
      let response = null;
      if (publiclyAvailable || openToCommunity) {
        response = await axios.post(`/api/activities/${activityId}/clone`);
        // publiclyAvailable ? trackDuplicatePublicActivity() : trackDuplicateCommunityActivity();
      }
      else response = await axios.post(`/api/institutions/${institutionId}/activities/${activityId}/clone`);
      const returnUrl = `/institutions/${institutionId}/activities`;
      router.push(`/institutions/${institutionId}/activities/${response.data.id}/edit?returnUrl=${returnUrl}`);
    } catch {
      setCloneRequest({ error: true });
    }
  }

  return (
    <>
    <MenuItem onClick={() => setCloneModalOpen(true)}>
      <ListItemIcon>
        <CopyAll fontSize="small" />
      </ListItemIcon>
      <ListItemText>{publiclyAvailable ? 'Copiar a mi biblioteca' : 'Duplicar'}</ListItemText>
    </MenuItem>
      <Dialog
        maxWidth="lg"
        open={cloneModalOpen}
        onClose={() => setCloneModalOpen(false)}
      >
        <DialogTitle>¿Quieres duplicar esta experiencia?</DialogTitle>
        <DialogContent>
          {publiclyAvailable ? (
            <Typography>
              Se creará una copia, podrás editar todo el contenido y quedará guardada en tu biblioteca de experiencias
            </Typography>
          ) : (
            <Typography>Se creará una copia, manteniendo la experiencia original y podrás editar todo el contenido</Typography>
          )}
          {cloneRequest.error && (
            <Typography color="error">No pudimos duplicar la experiencia</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setCloneModalOpen(false)}>Cancelar</Button>
          <LoadingButton
            variant="contained"
            onClick={handleCloneActivity}
            loading={cloneRequest.loading}
          >
            { publiclyAvailable ? 'Copiar' : 'Duplicar' }
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}