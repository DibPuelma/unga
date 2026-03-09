import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { getAllStudentsForInstitution } from "db/student";
import { getClassesByInstitution } from "db/class";
import { getInstitution } from "db/institution";
import { isAuthorized } from "services/Authorization";
import { serializeForNextProps } from "src/helpers/businessLogic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import axios from "axios";
import moment from "moment-timezone";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const {
    params: { institutionId },
  } = context;
  const institution = await getInstitution(institutionId);

  if (!institution) {
    return {
      notFound: true,
    };
  }

  const [students, classrooms] = await Promise.all([
    getAllStudentsForInstitution(institutionId),
    getClassesByInstitution(institutionId),
  ]);

  const rows = students.map((student) => ({
    id: student.id,
    name: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Sin nombre",
    rut: student.rut || "-",
    classroom: student.classroom?.name || "-",
    birthDate: student.birthDate ? moment.utc(student.birthDate).format("YYYY-MM-DD") : "-",
    active: !student.deactivatedAt,
  }));

  const classroomOptions = classrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name || "Sin nombre",
  }));

  return {
    props: serializeForNextProps({
      rows,
      classroomOptions,
      institution,
      institutionId,
    }),
  };
}

export default function InstitutionStudents({ rows, classroomOptions, institution, institutionId }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [targetClassroomId, setTargetClassroomId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, type: "success", text: "" });

  const allSelected = useMemo(
    () => rows.length > 0 && selectedIds.length === rows.length,
    [rows.length, selectedIds.length]
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < rows.length,
    [selectedIds.length, rows.length]
  );

  const showMessage = (type, text) => {
    setSnackbar({ open: true, type, text });
  };

  const handleToggleAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(rows.map((row) => row.id));
      return;
    }
    setSelectedIds([]);
  };

  const handleToggleOne = (studentId) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      showMessage("warning", "Selecciona al menos un estudiante.");
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar ${selectedIds.length} estudiante(s)? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const response = await axios.post(
        `/api/super-admin/institutions/${institutionId}/students/bulk`,
        {
          action: "delete",
          studentIds: selectedIds,
        }
      );
      showMessage("success", response.data?.message || "Estudiantes eliminados.");
      setSelectedIds([]);
      router.reload();
    } catch (error) {
      console.error("Error eliminando estudiantes masivamente:", error?.response?.data || error);
      showMessage("error", error.response?.data?.message || "No se pudo eliminar estudiantes.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenEditDialog = () => {
    if (selectedIds.length === 0) {
      showMessage("warning", "Selecciona al menos un estudiante.");
      return;
    }
    setTargetClassroomId("");
    setOpenEditDialog(true);
  };

  const handleBulkEdit = async () => {
    if (!targetClassroomId) {
      showMessage("warning", "Selecciona una sala destino.");
      return;
    }

    setEditLoading(true);
    try {
      const response = await axios.patch(
        `/api/super-admin/institutions/${institutionId}/students/bulk`,
        {
          studentIds: selectedIds,
          classroomId: targetClassroomId,
        }
      );
      showMessage("success", response.data?.message || "Estudiantes actualizados.");
      setSelectedIds([]);
      setOpenEditDialog(false);
      router.reload();
    } catch (error) {
      showMessage("error", error.response?.data?.message || "No se pudo actualizar estudiantes.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Estudiantes - {institution.name || "Institución"}</title>
      </Head>
      <Box sx={{ width: "100%" }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link href="/super-admin/pmf-answers" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography color="text.primary">Super Admin</Typography>
          </Link>
          <Link href="/super-admin/institutions" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography color="text.primary">Instituciones</Typography>
          </Link>
          <Link href={`/super-admin/institutions/${institutionId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Typography color="text.primary">{institution.name || "Institución"}</Typography>
          </Link>
          <Typography color="text.primary">Estudiantes</Typography>
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom>
          Estudiantes - {institution.name || "Institución"}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            loading={deleteLoading}
            disabled={selectedIds.length === 0}
          >
            Eliminar masivo
          </LoadingButton>
          <Button
            variant="outlined"
            onClick={handleOpenEditDialog}
            disabled={selectedIds.length === 0}
          >
            Editar masivo
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            Seleccionados: {selectedIds.length}
          </Typography>
        </Stack>

        <TableContainer>
          <Table sx={{ minWidth: 750 }} size="medium">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleToggleAll}
                    inputProps={{ "aria-label": "seleccionar todos los estudiantes" }}
                  />
                </TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>RUT</TableCell>
                <TableCell>Sala</TableCell>
                <TableCell>Fecha nacimiento</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleToggleOne(row.id)}
                      inputProps={{ "aria-label": `seleccionar estudiante ${row.name}` }}
                    />
                  </TableCell>
                  <TableCell>{index + 1}.- {row.name}</TableCell>
                  <TableCell>{row.rut}</TableCell>
                  <TableCell>{row.classroom}</TableCell>
                  <TableCell>{row.birthDate}</TableCell>
                  <TableCell>{row.active ? "Activo" : "Inactivo"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar estudiantes seleccionados</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Se actualizará la sala para {selectedIds.length} estudiante(s).
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="bulk-edit-classroom-label">Sala destino</InputLabel>
            <Select
              labelId="bulk-edit-classroom-label"
              value={targetClassroomId}
              label="Sala destino"
              onChange={(event) => setTargetClassroomId(event.target.value)}
            >
              {classroomOptions.map((classroom) => (
                <MenuItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={editLoading}>
            Cancelar
          </Button>
          <LoadingButton onClick={handleBulkEdit} loading={editLoading} variant="contained">
            Guardar cambios
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.type}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.text}
        </Alert>
      </Snackbar>
    </>
  );
}
