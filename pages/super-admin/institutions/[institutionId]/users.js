import { Alert, Box, Breadcrumbs, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import { getAllInstitutionUsers } from "db/user";
import { useState } from "react";
import { isAuthorized } from "services/Authorization";
import { visuallyHidden } from '@mui/utils';
import moment from "moment-timezone";
import { serializeForNextProps } from "src/helpers/businessLogic";
import { getInstitution } from "db/institution";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import { LoadingButton } from "@mui/lab";
import { Visibility, VisibilityOff } from "@mui/icons-material";

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

  const users = await getAllInstitutionUsers(institutionId);
  const rows = users.map((user) => ({
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre',
    email: user.email || '-',
    role: user.role || '-',
    phoneNumber: user.phoneNumber || '-',
    createdAt: moment(user.createdAt).format('YYYY-MM-DD'),
  }));

  return {
    props: serializeForNextProps({
      rows,
      institution,
      institutionId,
    }),
  };
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
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

const headCells = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Nombre',
  },
  {
    id: 'email',
    numeric: false,
    disablePadding: false,
    label: 'Email',
  },
  {
    id: 'role',
    numeric: false,
    disablePadding: false,
    label: 'Rol',
  },
  {
    id: 'phoneNumber',
    numeric: false,
    disablePadding: false,
    label: 'Teléfono',
  },
  {
    id: 'createdAt',
    numeric: false,
    disablePadding: false,
    label: 'Fecha creación',
  },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell align="right">Acciones</TableCell>
      </TableRow>
    </TableHead>
  );
}

export default function InstitutionUsers({ rows, institution, institutionId }) {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    userId: '',
    userName: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const openChangePasswordDialog = (userId, userName) => {
    setChangePasswordError('');
    setNewPassword('');
    setRepeatPassword('');
    setShowNewPassword(false);
    setShowRepeatPassword(false);
    setPasswordDialog({ open: true, userId, userName });
  };

  const closeChangePasswordDialog = () => {
    setPasswordDialog({ open: false, userId: '', userName: '' });
  };

  const handleChangePassword = async () => {
    if (!newPassword || !repeatPassword) {
      setChangePasswordError('Debes completar ambos campos.');
      return;
    }

    if (newPassword !== repeatPassword) {
      setChangePasswordError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setChangePasswordLoading(true);
      setChangePasswordError('');
      await axios.patch(`/api/users/${passwordDialog.userId}`, {
        password: newPassword,
      });
      setChangePasswordSuccess(true);
      closeChangePasswordDialog();
    } catch (e) {
      setChangePasswordError('No se pudo actualizar la contraseña.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Usuarios - {institution.name || 'Institución'}</title>
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
          <Typography color="text.primary">Usuarios</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          Usuarios - {institution.name || 'Institución'}
        </Typography>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="medium"
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {stableSort(rows, getComparator(order, orderBy))
                .map((row, index) => {
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.id}
                    >
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        padding="none"
                      >
                        {index + 1}.- {row.name}
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.phoneNumber}</TableCell>
                      <TableCell>{row.createdAt}</TableCell>
                      <TableCell align="right">
                        <LoadingButton
                          variant="outlined"
                          size="small"
                          onClick={() => openChangePasswordDialog(row.id, row.name)}
                        >
                          Cambiar contraseña
                        </LoadingButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={passwordDialog.open} onClose={closeChangePasswordDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Usuario: {passwordDialog.userName || '-'}
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Nueva contraseña"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowNewPassword((value) => !value)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              variant="outlined"
              label="Repetir nueva contraseña"
              type={showRepeatPassword ? "text" : "password"}
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showRepeatPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowRepeatPassword((value) => !value)}
                      edge="end"
                    >
                      {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {Boolean(changePasswordError) && (
              <Typography component="div" color="error" variant="caption" sx={{ mt: 1 }}>
                {changePasswordError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <LoadingButton
              variant="text"
              color="inherit"
              onClick={closeChangePasswordDialog}
              disabled={changePasswordLoading}
            >
              Cancelar
            </LoadingButton>
            <LoadingButton
              variant="contained"
              onClick={handleChangePassword}
              loading={changePasswordLoading}
            >
              Guardar
            </LoadingButton>
          </DialogActions>
        </Dialog>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={changePasswordSuccess}
          autoHideDuration={5000}
          onClose={() => setChangePasswordSuccess(false)}
        >
          <Alert onClose={() => setChangePasswordSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Contraseña actualizada con éxito
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}

