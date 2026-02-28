import { Add, Close, DeleteOutlined, EditOutlined, SearchOutlined, Upload } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import axios from "axios";
import moment from "moment-timezone";
import { useContext, useEffect, useMemo, useState } from "react";
import UngaFullScreenDialog from "../utils/UngaFullScreenDialog";
import UngaSelect from "../utils/UngaSelect";
import EditOrCreateStudent from "./EditOrCreateStudent";
import UploadCreateStudents from "./UploadCreateStudents";
import { DialogContext } from "src/context/DialogContext";


function descendingComparator(a, b, orderBy) {
  return b[orderBy].localeCompare(a[orderBy]);
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function studentToRow(student) {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    birthDate: student.birthDate ?
      moment(student.birthDate).format('DD [de] MMMM [de] YYYY') :
      'Sin fecha de nacimiento',
    sortableBirthDate: student.birthDate || '',
    rut: student.rut || 'Sin RUT',
    classroom: student.classroom?.name || student.class?.name,
    classroomId: student.classroomId || student.classId,
    active: student.deactivatedAt ? 'No' : 'Sí',
  }
}

export default function StudentsTable({
  students,
  allowedClassrooms,
  institutionId,
}) {
  const { setTitle, setDescription, handleOnConfirmChange, setOpen } = useContext(DialogContext);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('firstName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [massCreateDialogOpen, setMassCreateDialogOpen] = useState(false);
  const allowedClassroomsIds = useMemo(() => allowedClassrooms.map((classroom) => classroom.id), [allowedClassrooms])
  const [dynamicStudents, setDynamicStudents] = useState(
    [...students.filter((student) => allowedClassroomsIds.includes(student.classroomId || student.classId))]
  );
  const [editing, setEditing] = useState({});
  const [classroomChangeLoading, setClassroomChangeLoading] = useState({});
  const [activenessChangeLoading, setActivenessChangeLoading] = useState({});
  const rows = useMemo(() => dynamicStudents.map((student) => studentToRow(student)), [dynamicStudents]);

  const [orderedRows, setOrderedRows] = useState(
    stableSort(rows, getComparator(order, orderBy))
  );

  useEffect(() => {
    setOrderedRows(
      stableSort(orderedRows, getComparator(order, orderBy))
    );
  }, [order, orderBy, page, rowsPerPage])


  const handleSearch = ({ target: { value } }) => {
    setSearch(value);
    setOrderedRows(
      rows.filter((row) => (
        row.firstName.toLowerCase().includes(value.toLowerCase()) ||
        row.lastName.toLowerCase().includes(value.toLowerCase()) ||
        row.rut.toLowerCase().includes(value.toLowerCase())
      ))
    );
  }

  const handleSort = (property) => (event) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNewForm = () => {
    setShowNewForm(true);
  }

  const handleCreateStudent = (student) => {
    setDynamicStudents((prev) => [...prev, student]);
    const newRow = studentToRow(student);
    setOrderedRows((prev) => [newRow, ...prev]);
    setShowNewForm(false)
  }

  const handleEditStudent = (student) => {
    setDynamicStudents((prev) => {
      const index = prev.findIndex((s) => s.id === student.id);
      prev[index] = student;
      return prev;
    });
    setOrderedRows((prev) => {
      const index = prev.findIndex((s) => s.id === student.id);
      prev[index] = studentToRow(student);
      return prev;
    });
    toggleEdit(student.id);
  }

  const handleCreateStudents = (students) => {
    setDynamicStudents((prev) => [...prev, ...students]);
    const newRows = [];
    students.forEach((student) => {
      newRows.push(studentToRow(student));
    });
    setOrderedRows((prev) => [...newRows, ...prev]);
    setMassCreateDialogOpen(false);
  }

  const handleClassroomChange = async (e, studentId) => {
    const classroomId = e.target.value;
    const body = [{
      id: studentId,
      classroom: classroomId,
    }]
    setClassroomChangeLoading((prev) => ({ ...prev, [studentId]: true }));
    try {
      const response = await axios.patch(`/api/institutions/${institutionId}/students`, body)
      const student = response.data[0];
      setDynamicStudents((prev) => {
        const index = prev.findIndex((s) => s.id === student.id);
        prev[index] = student;
        return prev;
      });
      setOrderedRows((prev) => {
        const index = prev.findIndex((s) => s.id === student.id);
        prev[index] = studentToRow(student);
        return prev;
      });
      toggleEdit(student.id);
    } finally {
      setClassroomChangeLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  }

  const handleStudentActiveness = async (student) => {
    setActivenessChangeLoading((prev) => ({ ...prev, [student.id]: true }));
    try {
      let newStudent = null;
      if (student.active === 'Sí') {
        newStudent = await axios.patch(`/api/students/${student.id}/activation?action=DEACTIVATE`);
      } else if (student.active === 'No') {
        newStudent = await axios.patch(`/api/students/${student.id}/activation?action=ACTIVATE`);
      }
      setDynamicStudents((prev) => {
        const index = prev.findIndex((s) => s.id === student.id);
        prev[index].deactivatedAt = newStudent.data.deactivatedAt;
        return prev;
      });
      setOrderedRows((prev) => {
        const index = prev.findIndex((s) => s.id === student.id);
        prev[index].active = student.active === 'Sí' ? 'No' : 'Sí';
        return prev;
      });
      toggleEdit(student.id);
    } finally {
      setActivenessChangeLoading((prev) => ({ ...prev, [student.id]: false }));
    }
  }

  const toggleEdit = (studentId) => {
    setEditing((prev) => ({
      [studentId]: !prev[studentId]
    }));
  }

  const handleDeleteStudent = async (studentId) => {
    try {
      await axios.delete(`/api/institutions/${institutionId}/students/${studentId}`);
      setDynamicStudents((prev) => prev.filter((student) => student.id !== studentId));
      setOrderedRows((prev) => prev.filter((row) => row.id !== studentId));
    } finally {
      setOpen(false);
    }
  }

  const handleConfirmDeleteStudent = async (studentRow) => {
    setTitle(`¿Quieres eliminar a ${studentRow.firstName}?`)
    setDescription(`Eliminarás a ${studentRow.firstName} ${studentRow.lastName}. Esto no se puede deshacer.`)
    handleOnConfirmChange(() => handleDeleteStudent(studentRow.id))
    setOpen(true);
  }

  const headCells = [
    {
      id: 'firstName',
      label: 'Nombres',
      sortable: true,
    },
    {
      id: 'lastName',
      label: 'Apellidos',
      sortable: true,
    },
    {
      id: 'birthDate',
      sortId: 'sortableBirthDate',
      label: 'Nacimiento',
      sortable: true,
    },
    {
      id: 'rut',
      label: 'Rut',
      sortable: true,
    },
    {
      id: 'classroom',
      label: 'Sala',
      sortable: true,
    },
    {
      id: 'active',
      label: 'Activo',
      sortable: true,
    },
    {
      id: 'actions',
      label: 'Acciones',
      sortable: false,
    }
  ];

  return (
    <Stack>
      <Stack width="100%" direction={{ xs: 'column-reverse', sm: 'row' }} alignItems="flex-start" justifyContent="space-between" gap={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre"
          variant="standard"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
          }}
          value={search}
          onChange={handleSearch}
          sx={{ display: showNewForm ? 'none' : 'inherit' }}
        />
        <Stack width="100%" direction={{ xs: 'column-reverse', sm: 'row' }} alignItems="flex-start" gap={1}>
          <Button
            sx={{ display: showNewForm ? 'none' : 'inherit' }}
            fullWidth
            startIcon={<Upload />}
            onClick={() => setMassCreateDialogOpen(true)}
            variant="outlined"
          >
            Creación masiva
          </Button>
          <Button
            sx={{ display: showNewForm ? 'none' : 'inherit' }}
            fullWidth
            startIcon={<Add />}
            variant="contained"
            onClick={handleNewForm}
          >
            Creación manual
          </Button>
          {showNewForm && (
            <Box mb={4} width="100%">
              <EditOrCreateStudent
                onSave={handleCreateStudent}
                onCancel={() => setShowNewForm(false)}
                allowedClassrooms={allowedClassrooms}
              />
            </Box>
          )}
        </Stack>
      </Stack>
      {orderedRows.length === 0 ? (
        <Typography mt={2}>No tienes párvulos, para agregarlos clickea en alguno de los botones de arriba</Typography>
      ) : (
        <>
          <TableContainer sx={{ pb: 2, mt: 1, width: '75vw', overflow: 'scroll' }}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      sortDirection={orderBy === headCell.id ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        disabled={!headCell.sortable}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={handleSort(headCell.sortId || headCell.id)}
                        hideSortIcon={true}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orderedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((student) => {
                  if (editing[student.id]) {
                    return (
                      <TableRow
                        key={student.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell colSpan={4}>
                          <EditOrCreateStudent
                            student={dynamicStudents.find((s) => s.id === student.id)}
                            onSave={handleEditStudent}
                          />
                        </TableCell>
                        <TableCell>
                          {classroomChangeLoading[student.id] ? (
                            <CircularProgress size={16} />
                          ) : (
                            <UngaSelect
                              value={student.classroomId}
                              onChange={(e) => handleClassroomChange(e, student.id)}
                              options={allowedClassrooms}
                              label="Sala"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {activenessChangeLoading[student.id] ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Button onClick={() => handleStudentActiveness(student)}>
                              {student.active === 'Sí' ? 'Desactivar' : 'Activar'}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => toggleEdit(student.id)}>
                            <Close color="error" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return (
                    <TableRow
                      key={student.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        {student.firstName}
                      </TableCell>
                      <TableCell>
                        {student.lastName}
                      </TableCell>
                      <TableCell>
                        {student.birthDate}
                      </TableCell>
                      <TableCell>
                        {student.rut}
                      </TableCell>
                      <TableCell>
                        {student.classroom}
                      </TableCell>
                      <TableCell>
                        {student.active}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton onClick={() => toggleEdit(student.id)}>
                            <EditOutlined color="primary" />
                          </IconButton>
                          <IconButton onClick={() => handleConfirmDeleteStudent(student)}>
                            <DeleteOutlined color="error" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[20, 50, 100, 200]}
            component="div"
            count={orderedRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
          />
        </>
      )}
      <UngaFullScreenDialog
        open={massCreateDialogOpen}
        onClose={() => setMassCreateDialogOpen(false)}
      >
        <UploadCreateStudents
          institutionId={institutionId}
          allowedClassrooms={allowedClassrooms}
          onCreate={handleCreateStudents}
        />
      </UngaFullScreenDialog>
    </Stack>
  )
}