import { DeleteOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, ListItemIcon, MenuItem, Typography } from "@mui/material";
import axios from "axios";
import { useState } from "react";

export default function DeleteActivityButton({ activityId, institutionId, onDelete }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await axios.delete(`/api/institutions/${institutionId}/activities/${activityId}`);
    setLoading(false);
    setDeleteModalOpen(false)
    onDelete();
  }

  const openModal = () => setDeleteModalOpen(true);

  return (
    <>
      <MenuItem onClick={openModal}>
        <ListItemIcon>
          <DeleteOutlined color="error" fontSize="small" />
        </ListItemIcon>
        <Typography color="error">Eliminar</Typography>
      </MenuItem>
      <Dialog
        maxWidth="lg"
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      >
        <DialogTitle>¿Quieres eliminar esta experiencia?</DialogTitle>
        <DialogContent>
          <Typography>
            Se borrará de la biblioteca para siempre
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
          <LoadingButton
            variant="contained"
            onClick={handleDelete}
            loading={loading}
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}