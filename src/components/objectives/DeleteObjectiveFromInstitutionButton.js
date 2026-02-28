import { useContext, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from 'axios';
import { DeleteOutlined } from "@mui/icons-material";
import { Alert, CircularProgress, IconButton, Snackbar } from "@mui/material";
import { DialogContext } from "src/context/DialogContext";

export default function DeleteObjectiveFromInstitutionButton({ objective, onDelete, institutionId }) {
  const {
    setTitle,
    setDescription,
    setOpen,
    handleOnConfirmChange
  } = useContext(DialogContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectiveType = useMemo(() => objective.objective ? 'subObjective' : 'objective', [objective]);


  const handleDeleteConfirmation = () => {
    setTitle('¿Quieres eliminar este indicador?');
    setDescription('Esta acción es irreversible. Las evaluaciones que hayas realizado con este indicador se perderán.');
    handleOnConfirmChange(() => handleDelete());
    setOpen(true);
  }

  const handleDelete = async () => {
    setLoading(true);
    setOpen(false);
    try {
      if (objectiveType === 'objective') {
        await axios.delete(`/api/institutions/${institutionId}/objectives/${objective.id}`);
      } else if (objectiveType === 'subObjective') {
        await axios.delete(`/api/institutions/${institutionId}/objectives/${objective.objective.id}/sub-objectives/${objective.id}`);
      }
      onDelete(objective.id, objectiveType)
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false)
    }
  }

  if (!onDelete) return null;

  return (
    <>
      <IconButton onClick={handleDeleteConfirmation} disabled={loading}>
        {loading ? <CircularProgress size={16} /> : <DeleteOutlined color="error" />}
      </IconButton>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={error}
        onClose={() => setError(false)}
        autoHideDuration={5000}
      >
        <Alert onClose={() => setError(false)} severity="error" sx={{ width: '100%' }}>
          No fue posible eliminar el indicador
        </Alert>
      </Snackbar>
    </>
  )
}