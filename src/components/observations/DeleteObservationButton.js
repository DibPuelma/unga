import { DeleteOutlined } from "@mui/icons-material";
import { Button, IconButton } from "@mui/material";
import axios from "axios";
import { useContext } from "react"
import { DialogContext } from "src/context/DialogContext"

export default function DeleteObservationButton({ id, onDelete }) {
  const { setTitle, setDescription, handleOnConfirmChange, setOpen } = useContext(DialogContext);
  const handleDeleteConfirmation = () => {
    setTitle('¿Quieres eliminar esta observación?')
    setDescription('Esta acción no se puede deshacer')
    handleOnConfirmChange(handleDelete);
    setOpen(true);
  }

  const handleDelete = async () => {
    await axios.delete(`/api/observations/${id}`);
    onDelete(id)
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteOutlined />}
        sx={{ display: { xs: 'none', sm: 'inherit' } }}
        onClick={handleDeleteConfirmation}
      >
        Eliminar
      </Button>
      <IconButton
        color="error"
        sx={{ display: { sm: 'none' } }}
        onClick={handleDeleteConfirmation}
      >
        <DeleteOutlined fontSize="small" />
      </IconButton>
    </>
  )
}