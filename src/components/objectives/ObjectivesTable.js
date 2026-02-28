import { Add, CancelOutlined, DeleteOutlined, EditOutlined, SaveOutlined, SearchOutlined, Upload } from "@mui/icons-material";
import { Box, Button, Checkbox, CircularProgress, IconButton, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import UngaFullScreenDialog from "../utils/UngaFullScreenDialog";
import UngaSelectObjectives from "../utils/UngaSelectObjectives";
import UploadCreateObjectives from "./UploadCreateObjectives";
import NewFormSimple from "./NewFormSimple";
import DeleteObjectiveFromInstitutionButton from "./DeleteObjectiveFromInstitutionButton";
import { intersection } from "lodash";
import ClickableTooltip from "../utils/ClickableTooltip";
import { idMapper } from "src/helpers/parsers";
import { UserContext } from "src/context/UserContext";


function descendingComparator(a, b, orderBy) {
  return b[orderBy].toString().localeCompare?.(a[orderBy]);
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

export default function ObjectivesTable({
  objectives,
  allCores,
  allowedClassrooms,
  institutionId,
  allCurricularObjectives,
}) {
  const { user } = useContext(UserContext);
  const objectiveToRow = (objective) => {
    const objectiveClassroomsIds = objective.classrooms.filter(
      (classroom) => !Boolean(classroom.deletedAt)
    ).map(
      (classroom) => classroom.id
    );
    return ({
      id: objective.id,
      name: objective.name,
      core: objective.core.name,
      levelsIds: objective.levels.map((level) => level.id),
      coreId: objective.core.id,
      curricularObjective: objective.curricularObjective ? idMapper(objective.curricularObjective) : 'noSelection',
      classrooms: objectiveClassroomsIds,
      ...(allowedClassrooms.reduce((acc, classroom) => {
        acc[classroom.id] = objectiveClassroomsIds.includes(classroom.id);
        return acc;
      }, {})),
    });
  }
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [massCreateDialogOpen, setMassCreateDialogOpen] = useState(false);
  const [dynamicObjectives, setDynamicObjectives] = useState([...objectives]);
  const [editing, setEditing] = useState({});
  const rows = useMemo(() => dynamicObjectives.map(objectiveToRow), [dynamicObjectives]);
  const [loadingCurricularObjective, setLoadingCurricularObjective] = useState(rows.reduce(
    (acc, row) => {
      if (!acc[row.id]) acc[row.id] = false;
      return acc;
    }, {})
  );
  const allowedClassroomsIds = useMemo(() => allowedClassrooms.map((classroom) => classroom.id), [allowedClassrooms]);

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
      rows.filter((row) => row.name.toLowerCase().includes(value.toLowerCase()))
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

  const handleCreateObjective = (objective) => {
    setDynamicObjectives((prev) => [...prev, objective]);
    const newRow = objectiveToRow(objective);
    setOrderedRows((prev) => [newRow, ...prev]);
    setShowNewForm(false)
  }

  const handleCreateObjectives = (objectives) => {
    setDynamicObjectives((prev) => [...prev, ...objectives]);
    const newRows = [];
    objectives.forEach((objective) => {
      newRows.push(objectiveToRow(objective))
    });
    setOrderedRows((prev) => [...newRows, ...prev]);
    setMassCreateDialogOpen(false);
  }

  const updateObjectives = (newObjective) => {
    setDynamicObjectives((prev) => {
      const index = prev.findIndex((row) => row.id === newObjective.id);
      const newObjectives = [...prev];
      newObjectives[index] = newObjective;
      return newObjectives;
    })
    setOrderedRows((prev) => {
      const index = prev.findIndex((row) => row.id === newObjective.id);
      const newRows = [...prev];
      newRows[index] = objectiveToRow(newObjective);
      return newRows;
    })
  }

  const handleCheckObjective = async (e, objectiveId, classroom) => {
    const { target: { checked } } = e;
    const objectiveIndex = dynamicObjectives.findIndex((obj) => obj.id === objectiveId);
    const newObjective = { ...dynamicObjectives[objectiveIndex] };
    const oldClassrooms = newObjective.classrooms;
    if (checked) {
      newObjective.classrooms = [...oldClassrooms, classroom];
    } else {
      newObjective.classrooms = oldClassrooms.filter((oldClassroom) => oldClassroom.id !== classroom.id);
    }
    updateObjectives(newObjective);
    try {
      let response = null;
      if (checked) {
        response = await axios.patch(`/api/institutions/${institutionId}/objectives/${objectiveId}`, {
          newClassroom: classroom.id,
        })
      } else {
        response = await axios.delete(`/api/classrooms/${classroom.id}/objectives/${objectiveId}`);
      }
      const updatedObjective = response.data;
      updateObjectives(updatedObjective)
    } catch {
      newObjective.classrooms = oldClassrooms;
      updateObjectives(newObjective);
    }
  }

  const handleCurricularObjectiveChange = async (e, objectiveId) => {
    const { target: { value } } = e;
    setLoadingCurricularObjective((prev) => ({
      ...prev,
      [objectiveId]: true,
    }))

    const newCurricularObjective = value === 'noSelection' ? null : value;
    const response = await axios.patch(`/api/institutions/${institutionId}/objectives/${objectiveId}`, {
      curricularObjective: newCurricularObjective,
    })
    const updatedObjective = response.data;
    updateObjectives(updatedObjective)
    setLoadingCurricularObjective((prev) => ({
      ...prev,
      [objectiveId]: false,
    }))
  }

  const handleSaveName = async (objectiveId) => {
    setEditing((prev) => ({ ...prev, [objectiveId]: { ...prev[objectiveId], editing: true, loading: true } }));
    const response = await axios.patch(`/api/institutions/${institutionId}/objectives/${objectiveId}`, {
      name: editing[objectiveId].name,
    })
    const updatedObjective = response.data;
    updateObjectives(updatedObjective)
    setEditing((prev) => ({ ...prev, [objectiveId]: { editing: false, name: '', loading: false } }));
  }

  const handleEdit = (row) => {
    setEditing((prev) => ({ ...prev, [row.id]: { editing: true, name: row.name } }));
  }

  const handleCancelEdit = (objectiveId) => {
    setEditing((prev) => ({ ...prev, [objectiveId]: { editing: false, name: '' } }));
  }

  const handleNameChange = ({ target: { value } }, objectiveId) => {
    setEditing((prev) => ({
      ...prev,
      [objectiveId]: {
        ...prev[objectiveId],
        name: value,
      },
    }));
  };

  const handleDelete = (objectiveId) => {
    setOrderedRows((prev) => prev.filter((row) => row.id !== objectiveId));
    setDynamicObjectives((prev) => prev.filter((objective) => objective.id !== objectiveId));
  }

  const headCells = [
    {
      id: 'name',
      label: 'Nombre',
      sortable: true,
    },
    {
      id: 'core',
      label: 'Núcleo',
      sortable: true,
    },
    {
      id: 'curricularObjective',
      label: 'OA relacionado',
      sortable: false,
    },
    ...allowedClassrooms.map((classroom) => ({
      id: classroom.id,
      label: (
        <Stack width={150}>
          <Typography variant="body2" fontWeight={500}>{classroom.name}</Typography>
          <Typography variant="caption">{classroom.level.name}</Typography>
        </Stack>
      ),
      sortable: true,
    })),
    {
      id: 'actions',
      label: 'Acciones',
      sortable: false,
    },
  ];

  return (
    <Stack>
      <Stack direction={{ xs: 'column-reverse', sm: 'row' }} alignItems="flex-start" justifyContent="space-between" spacing={2}>
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
        <Stack width="100%" direction={{ xs: 'column-reverse', sm: 'row' }} alignItems="flex-start" spacing={1}>
          <Button
            sx={{ display: showNewForm ? 'none' : 'inherit' }}
            fullWidth
            startIcon={<Upload />}
            onClick={() => setMassCreateDialogOpen(true)}
            variant="outlined"
          >
            Creación masiva
          </Button>
          <Box display={!showNewForm ? 'none' : 'inherit'} width="100%">
            <NewFormSimple
              creating={showNewForm}
              buttonLabel="Crear indicador"
              onCreate={handleCreateObjective}
              onCancel={() => setShowNewForm(false)}
              cores={allCores}
              classrooms={allowedClassrooms}
              institutionId={institutionId}
            />
          </Box>
          <Button
            sx={{ display: showNewForm ? 'none' : 'inherit' }}
            fullWidth
            startIcon={<Add />}
            variant="contained"
            onClick={handleNewForm}
          >
            Creación manual
          </Button>
        </Stack>
      </Stack>
      {orderedRows.length === 0 ? (
        <Typography mt={2}>No tienes indicadores, para agregarlos clickea en alguno de los botones de arriba</Typography>
      ) : (
        <Box overflow="scroll" maxWidth="95vw">
          <TableContainer sx={{ pb: 2, mt: 1, overflow: 'scroll' }}>
            <Table size="small">
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
                        onClick={handleSort(headCell.id)}
                        hideSortIcon={true}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orderedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell colSpan={editing[row.id]?.editing ? allowedClassrooms.length + 3 : 1}>
                      {editing[row.id]?.editing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editing[row.id]?.name}
                          onChange={(e) => handleNameChange(e, row.id)}
                        />
                      ) :
                        row.name
                      }
                    </TableCell>
                    {!editing[row.id]?.editing && (
                      <>
                        <TableCell>
                          {row.core}
                        </TableCell>
                        <TableCell>
                          {loadingCurricularObjective[row.id] ? (
                            <Stack alignItems="center">
                              <CircularProgress size={16} />
                            </Stack>
                          ) : (
                            <UngaSelectObjectives
                              objectives={allCurricularObjectives}
                              noSelectionValue={<MenuItem value="noSelection">Sin OA relacionado</MenuItem>}
                              allCores={allCores}
                              onChange={(e) => handleCurricularObjectiveChange(e, row.id)}
                              value={row.curricularObjective}
                              filteredCores={row.coreId}
                              filteredLevels={row.levelsIds}
                              menuMaxWidth={1000}
                              renderValue={(value) => value === 'noSelection' ?
                                'Sin OA re...' :
                                `${allCurricularObjectives.find(
                                  (objective) => objective.id === value)?.name.slice(0, 10)
                                }...`
                              }
                            />
                          )}
                        </TableCell>
                        {allowedClassrooms.map((classroom) => (
                          <TableCell key={classroom.id}>
                            <Checkbox
                              size="small"
                              checked={row[classroom.id]}
                              onClick={(e) => handleCheckObjective(e, row.id, classroom)}
                            />
                          </TableCell>
                        ))}
                      </>
                    )}
                    <TableCell>
                      <Stack direction="row" alignItems="center">
                        {editing[row.id]?.editing ? (
                          <>
                            <IconButton onClick={() => handleSaveName(row.id)}>
                              {editing[row.id]?.loading ? (
                                <CircularProgress size={16} />
                              ) : (
                                <SaveOutlined color="primary" />
                              )}
                            </IconButton>
                            <IconButton onClick={() => handleCancelEdit(row.id)}>
                              <CancelOutlined color="error" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton onClick={() => handleEdit(row)}>
                              <EditOutlined color="primary" />
                            </IconButton>
                            {(user.role === 'principal' || user.role === 'coordinator'
                              || intersection(allowedClassroomsIds, row.classrooms).length === row.classrooms.length) ? (
                              <DeleteObjectiveFromInstitutionButton
                                objective={dynamicObjectives.find((objective) => objective.id === row.id)}
                                onDelete={handleDelete}
                                institutionId={institutionId}
                              />
                            ) : (
                              <ClickableTooltip
                                title="Solo puedes eliminar indicadores que no compartas con otras educadoras"
                                icon={<DeleteOutlined />}
                                sx={(theme) => ({ color: theme.palette.grey[500] })}
                              />
                            )}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
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
        </Box>
      )}
      <UngaFullScreenDialog
        open={massCreateDialogOpen}
        onClose={() => setMassCreateDialogOpen(false)}
      >
        <UploadCreateObjectives
          allCores={allCores}
          allowedClassrooms={allowedClassrooms}
          institutionId={institutionId}
          onCreate={handleCreateObjectives}
        />
      </UngaFullScreenDialog>
    </Stack>
  )
}