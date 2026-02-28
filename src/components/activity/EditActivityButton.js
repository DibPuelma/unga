import { EditOutlined } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { PlanningContext } from "src/context/PlanningContext";

export default function EditActivityButton({ activity, institutionId }) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const goToEdit = () => {
    router.push(`/institutions/${institutionId}/activities/${activity.id}/edit`);
  }

  const openModal = () => setEditModalOpen(true);

  return (
    <>
      <MenuItem onClick={openModal}>
        <ListItemIcon>
          <EditOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText>Editar</ListItemText>
      </MenuItem>
      <Dialog
        maxWidth="lg"
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      >
        <DialogTitle>¿Quieres editar esta experiencia?</DialogTitle>
        <DialogContent>
          <Typography>
            Cambiarás la experiencia en todos los días que se haya calendarizado. Si quieres mantener la original, usa el botón "Duplicar".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={goToEdit}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}