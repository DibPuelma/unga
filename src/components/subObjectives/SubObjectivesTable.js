import { Add, CancelOutlined, DeleteOutlined, EditOutlined, SaveOutlined, SearchOutlined, Upload } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import UngaSelectObjectives from "../utils/UngaSelectObjectives";
import NewForm from "./NewForm";
import { intersection } from "lodash";
import ClickableTooltip from "../utils/ClickableTooltip";
import DeleteObjectiveFromInstitutionButton from "../objectives/DeleteObjectiveFromInstitutionButton";
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

export default function SubObjectivesTable({
  allSubObjectives,
  allCores,
  allowedClassrooms,
  institutionId,
  allObjectives,
}) {
  const { user } = useContext(UserContext);
  const subObjectiveToRow = (subObjective) => {
    const subObjectiveClassroomsIds = subObjective.classrooms?.map((classroom) => classroom.id);
    return ({
      id: subObjective.id,
      name: subObjective.name,
      core: subObjective.core?.name,
      coreId: subObjective.coreId || subObjective.core?.id,
      objective: subObjective.objectiveId || subObjective.objective?.id || 'noSelection',
      classrooms: subObjectiveClassroomsIds,
    });
  }
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [dynamicSubObjectives, setDynamicSubObjectives] = useState([...allSubObjectives]);
  const [editing, setEditing] = useState({});
  const rows = useMemo(() => dynamicSubObjectives.map(subObjectiveToRow), [dynamicSubObjectives]);
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

  const handleCreateObjective = (subObjective) => {
    setDynamicSubObjectives((prev) => [...prev, subObjective]);
    const newRow = subObjectiveToRow(subObjective);
    setOrderedRows((prev) => [newRow, ...prev]);
    setShowNewForm(false)
  }

  const updateObjectives = (newObjective) => {
    setDynamicSubObjectives((prev) => {
      const index = prev.findIndex((row) => row.id === newObjective.id);
      const newObjectives = [...prev];
      newObjectives[index] = newObjective;
      return newObjectives;
    })
    setOrderedRows((prev) => {
      const index = prev.findIndex((row) => row.id === newObjective.id);
      const newRows = [...prev];
      newRows[index] = subObjectiveToRow(newObjective);
      return newRows;
    })
  }

  const handleObjectiveChange = async (e, objectiveId, subObjectiveId) => {
    const { target: { value } } = e;
    setLoadingCurricularObjective((prev) => ({
      ...prev,
      [subObjectiveId]: true,
    }))

    const newObjective = value === 'noSelection' ? null : value;
    const response = await axios.patch(`/api/institutions/${institutionId}/objectives/${objectiveId}/sub-objectives/${subObjectiveId}`, {
      objectiveId: newObjective,
    })
    const updatedObjective = response.data;
    updateObjectives(updatedObjective)
    setLoadingCurricularObjective((prev) => ({
      ...prev,
      [subObjectiveId]: false,
    }))
  }

  const handleSaveName = async (objectiveId, subObjectiveId) => {
    setEditing((prev) => ({ ...prev, [subObjectiveId]: { ...prev[subObjectiveId], editing: true, loading: true } }));
    const response = await axios.patch(`/api/institutions/${institutionId}/objectives/${objectiveId}/sub-objectives/${subObjectiveId}`, {
      name: editing[subObjectiveId].name,
    })
    const updatedObjective = response.data;
    updateObjectives(updatedObjective)
    setEditing((prev) => ({ ...prev, [subObjectiveId]: { editing: false, name: '', loading: false } }));
  }

  const handleEdit = (row) => {
    setEditing((prev) => ({ ...prev, [row.id]: { editing: true, name: row.name } }));
  }

  const handleCancelEdit = (subObjectiveId) => {
    setEditing((prev) => ({ ...prev, [subObjectiveId]: { editing: false, name: '' } }));
  }

  const handleNameChange = ({ target: { value } }, subObjectiveId) => {
    setEditing((prev) => ({
      ...prev,
      [subObjectiveId]: {
        ...prev[subObjectiveId],
        name: value,
      },
    }));
  };

  const handleDelete = (subObjectiveId) => {
    setOrderedRows((prev) => prev.filter((row) => row.id !== subObjectiveId));
    setDynamicSubObjectives((prev) => prev.filter((subObjective) => subObjective.id !== subObjectiveId));
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
      id: 'objective',
      label: 'Indicador relacionado',
      sortable: true,
    },
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
        <Stack
          width="100%"
          direction={{ xs: 'column-reverse', sm: 'row' }}
          justifyContent="flex-end"
          spacing={1}
        >
          <Box display={showNewForm ? 'inherit' : 'none'} width="100%">
            <NewForm
              direction="row"
              objectives={allObjectives}
              onCreate={handleCreateObjective}
              onClose={() => setShowNewForm(false)}
              availableCores={allCores}
              availableLevelsIds={allowedClassrooms.map((classroom) => classroom.level?.id || classroom.levelId)}
            />
          </Box>
          <Button
            sx={{ display: showNewForm ? 'none' : 'inherit' }}
            startIcon={<Add />}
            variant="contained"
            onClick={handleNewForm}
          >
            Crear nuevo
          </Button>
        </Stack>
      </Stack>
      {orderedRows.length === 0 ? (
        <Typography mt={2}>No tienes indicadores de evaluación, para agregarlos clickea en el botón de arriba</Typography>
      ) : (
        <>
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
                              objectives={allObjectives}
                              noSelectionValue={<MenuItem value="noSelection">Sin indicador relacionado</MenuItem>}
                              allCores={allCores}
                              onChange={(e) => handleObjectiveChange(e, row.objective, row.id)}
                              value={row.objective}
                              filteredCores={row.coreId}
                              menuMaxWidth={1000}
                              renderValue={(value) => {
                                if (value === 'noSelection') return 'Sin indicador relacionado';
                                const objective = allObjectives.find((objective) => objective.id === value);
                                if (!objective) return 'Sin indicador relacionado';
                                return `${allObjectives.find(
                                  (objective) => objective.id === value
                                )?.name.slice(0, 25)
                                }...`
                              }}
                            />
                          )}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Stack direction="row" alignItems="center">
                        {editing[row.id]?.editing ? (
                          <>
                            <IconButton onClick={() => handleSaveName(row.objective, row.id)}>
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
                              || intersection(allowedClassroomsIds, row.classrooms).length === row.classrooms?.length) ? (
                              <DeleteObjectiveFromInstitutionButton
                                objective={dynamicSubObjectives.find((subObjective) => subObjective.id === row.id)}
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
        </>
      )}
    </Stack>
  )
}