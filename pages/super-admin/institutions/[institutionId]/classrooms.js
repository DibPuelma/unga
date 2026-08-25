import { Box, Breadcrumbs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Snackbar, Alert } from "@mui/material";
import { getClassesByInstitution } from "db/class";
import { getStudentsForClassroom } from "db/student";
import { isAuthorized } from "services/Authorization";
import { serializeForNextProps } from "src/helpers/businessLogic";
import { getInstitution } from "db/institution";
import Head from "next/head";
import prisma from "lib/prisma";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { LoadingButton } from "@mui/lab";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { params: { institutionId } } = context;
  const institution = await getInstitution(institutionId);

  if (!institution) {
    return {
      notFound: true,
    };
  }

  const classrooms = await getClassesByInstitution(institutionId);
  
  // For each classroom, fetch main teacher, all teachers, and students
  const classroomsWithDetails = await Promise.all(
    classrooms.map(async (classroom) => {
      // Get main teacher
      const mainTeacher = classroom.mainTeacherId
        ? await prisma.user.findUnique({
            where: { id: classroom.mainTeacherId },
          })
        : null;

      // Get all teachers assigned to this classroom (users with classrooms array containing this classroom ID)
      const allTeachers = await prisma.user.findMany({
        where: {
          classrooms: { has: classroom.id },
          institutionId,
        },
      });

      // Get students
      const students = await getStudentsForClassroom(classroom.id);

      return {
        id: classroom.id,
        name: classroom.name || 'Sin nombre',
        level: classroom.Levels?.name || '-',
        mainTeacher: mainTeacher
          ? `${mainTeacher.firstName || ''} ${mainTeacher.lastName || ''}`.trim() || mainTeacher.email || '-'
          : '-',
        allTeachers: allTeachers.map((t) =>
          `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.email || '-'
        ),
        studentCount: students.length,
        students: students.map((s) => `${s.firstName} ${s.lastName}`),
      };
    })
  );

  return {
    props: serializeForNextProps({
      classrooms: classroomsWithDetails,
      institution,
      institutionId,
    }),
  };
}

export default function InstitutionClassrooms({ classrooms, institution, institutionId }) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleDeleteClick = (classroom, event) => {
    event.stopPropagation();
    setClassroomToDelete(classroom);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClassroomToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!classroomToDelete) return;

    setLoading(true);
    try {
      await axios.delete(
        `/api/super-admin/institutions/${institutionId}/classrooms/${classroomToDelete.id}`
      );
      setMessage({ type: 'success', text: 'Sala eliminada exitosamente' });
      setOpenSnackbar(true);
      handleCloseDeleteDialog();
      router.reload();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar la sala';
      setMessage({ type: 'error', text: errorMessage });
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Salas - {institution.name || 'Institución'}</title>
      </Head>
      <Box sx={{ width: '100%' }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link href="/super-admin/pmf-answers" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Super Admin</Typography>
          </Link>
          <Link href="/super-admin/institutions" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">Instituciones</Typography>
          </Link>
          <Link href={`/super-admin/institutions/${institutionId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography color="text.primary">{institution.name || 'Institución'}</Typography>
          </Link>
          <Typography color="text.primary">Salas</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Salas - {institution.name || 'Institución'}
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Sala</TableCell>
                <TableCell>Nivel</TableCell>
                <TableCell>Profesor Principal</TableCell>
                <TableCell>Profesores</TableCell>
                <TableCell>Cantidad Estudiantes</TableCell>
                <TableCell>Estudiantes</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classrooms.map((classroom, index) => (
                <TableRow key={classroom.id} hover>
                  <TableCell>{index + 1}.- {classroom.name}</TableCell>
                  <TableCell>{classroom.level}</TableCell>
                  <TableCell>{classroom.mainTeacher}</TableCell>
                  <TableCell>
                    {classroom.allTeachers.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {classroom.allTeachers.map((teacher, idx) => (
                          <Chip key={idx} label={teacher} size="small" />
                        ))}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{classroom.studentCount}</TableCell>
                  <TableCell>
                    {classroom.students.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {classroom.students.map((student, idx) => (
                          <Chip key={idx} label={student} size="small" variant="outlined" />
                        ))}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleDeleteClick(classroom, e)}
                      color="error"
                      size="small"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Eliminar Sala</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la sala "{classroomToDelete?.name}"?
            <br />
            <br />
            Esta acción eliminará la sala pero <strong>NO</strong> eliminará:
            <ul>
              <li>Los estudiantes asociados</li>
              <li>Los profesores asociados</li>
              <li>Los objetivos asociados</li>
            </ul>
            La sala será desasociada de los objetivos, pero los objetivos permanecerán intactos.
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <LoadingButton
            loading={loading}
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={message.type}
          sx={{ width: '100%' }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </>
  );
}

