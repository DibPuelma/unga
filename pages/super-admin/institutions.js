import { Box, Breadcrumbs, Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { isAuthorized } from "services/Authorization";
import { visuallyHidden } from '@mui/utils';
import moment from "moment-timezone";
import prisma from "lib/prisma";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { LoadingButton } from "@mui/lab";
import { Add } from "@mui/icons-material";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const institutions = await prisma.institutions.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const rows = institutions.map((institution) => ({
    id: institution.id,
    name: institution.name || 'Sin nombre',
    code: institution.code || '-',
    country: institution.country || '-',
    createdAt: moment(institution.createdAt).format('YYYY-MM-DD'),
  }));

  return {
    props: {
      rows
    }
  }
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
    id: 'code',
    numeric: false,
    disablePadding: false,
    label: 'Código',
  },
  {
    id: 'country',
    numeric: false,
    disablePadding: false,
    label: 'País',
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
      </TableRow>
    </TableHead>
  );
}

export default function Institutions({ rows }) {
  const router = useRouter();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    address: '',
    mobilePhone: '',
    email: '',
    webpage: '',
  });
  const [error, setError] = useState('');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleRowClick = (institutionId) => {
    router.push(`/super-admin/institutions/${institutionId}`);
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    setFormData({
      name: '',
      code: '',
      country: '',
      address: '',
      mobilePhone: '',
      email: '',
      webpage: '',
    });
    setError('');
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setError('');
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleCreateInstitution = async () => {
    if (!formData.name) {
      setError('El nombre es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/institutions', formData);
      handleCloseCreateDialog();
      router.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la institución');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link href="/super-admin/pmf-answers" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography color="text.primary">Super Admin</Typography>
        </Link>
        <Typography color="text.primary">Instituciones</Typography>
      </Breadcrumbs>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Crear Institución
        </Button>
      </Box>
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nueva Institución</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              fullWidth
            />
            <TextField
              label="Código"
              value={formData.code}
              onChange={handleInputChange('code')}
              fullWidth
            />
            <TextField
              label="País"
              value={formData.country}
              onChange={handleInputChange('country')}
              fullWidth
            />
            <TextField
              label="Dirección"
              value={formData.address}
              onChange={handleInputChange('address')}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Teléfono Móvil"
              value={formData.mobilePhone}
              onChange={handleInputChange('mobilePhone')}
              fullWidth
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={handleInputChange('email')}
              type="email"
              fullWidth
            />
            <TextField
              label="Página Web"
              value={formData.webpage}
              onChange={handleInputChange('webpage')}
              fullWidth
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancelar</Button>
          <LoadingButton
            loading={loading}
            onClick={handleCreateInstitution}
            variant="contained"
          >
            Crear
          </LoadingButton>
        </DialogActions>
      </Dialog>
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
                    onClick={() => handleRowClick(row.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      {index + 1}.- {row.name}
                    </TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.country}</TableCell>
                    <TableCell>{row.createdAt}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

