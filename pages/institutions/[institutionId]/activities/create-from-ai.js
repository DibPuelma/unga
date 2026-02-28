import dynamic from 'next/dynamic';
import { AddOutlined, CloseOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Grid, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { searchActivities } from "db/activity";
import { getCores } from "db/core";
import { getNonHeterogeneousLevels } from "db/level";
import { useContext, useEffect, useState } from "react";
import { isAuthorized } from "services/Authorization";
import ActivityCard from "src/components/activity/ActivityCard";
import Searchbar from "src/components/utils/Searchbar";
import UngaSelect from "src/components/utils/UngaSelect";
import { idMapper, nameMapper } from "src/helpers/parsers";
import useActivitiesFilters from "src/hooks/useActivitiesFilters";
const QuillNoSSRWrapper = dynamic(import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
})
import 'react-quill/dist/quill.snow.css';
import { UserContext } from 'src/context/UserContext';
import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/router';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;
  const session = await getServerSession(context.req, context.res, authOptions);
  const { user: { institution: { id: institutionId } } } = session;

  const publicActivities = await searchActivities({ publiclyAvailable: true, pageSize: 1000 });
  const allCores = await getCores(institutionId);
  const levels = await getNonHeterogeneousLevels();

  return {
    props: serializeForNextProps({
      publicActivities,
      allCores,
      levels,
    })
  }
}

const DRAWER_WIDTH = 300;

export default function CreateActivitiesFromAI({ publicActivities, allCores, levels }) {
  const { institution: { features, id: institutionId } } = useContext(UserContext);
  const router = useRouter();
  const [filteredActivities, setFilteredActivities] = useState(publicActivities.data);
  const [selectedActivitiesIds, setSelectedActivitiesIds] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(publicActivities.data[0]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [gptLoading, setGptLoading] = useState(false);
  const [suggestedActivity, setSuggestedActivity] = useState('a');
  const [createLoading, setCreateLoading] = useState(false);
  const [rows, setRows] = useState([])
  const { filters, handleSearchChange, handleMultipleSelectChange } = useActivitiesFilters({ allCores });
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  useEffect(() => {
    setRows(filteredActivities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      recommendedLevels: activity.recommendedLevels.map(nameMapper).join(', '),
      cores: activity.cores.map(nameMapper).join(', '),
    })))
  }, [filteredActivities])

  const handleSearchActivities = () => {
    const { searchText, recommendedLevels, cores } = filters;
    const filteredActivities = publicActivities.data.filter((activity) => {
      const activityName = activity.name.toLowerCase();
      const searchTextMatch = searchText === '' || activityName.includes(searchText.toLowerCase());
      const recommendedLevelsMatch = recommendedLevels.length === 0 || recommendedLevels.some((level) => activity.recommendedLevels.map(idMapper).includes(level));
      const coresMatch = cores.length === 0 || cores.some((core) => activity.cores.map(idMapper).includes(core));
      return searchTextMatch && recommendedLevelsMatch && coresMatch;
    });
    setFilteredActivities(filteredActivities);
  };

  const handleClearFilters = () => {
    setFilteredActivities(publicActivities.data);
  };

  const handleSelectActivity = (id) => {
    if (selectedActivitiesIds.length >= 3) return;
    const newIds = new Set(selectedActivitiesIds);
    newIds.add(id);
    setSelectedActivitiesIds([...newIds]);
  };

  const handleUnselectActivity = (id) => {
    setSelectedActivitiesIds((oldValue) => oldValue.filter((oldId) => oldId !== id));
  }

  const handleShowActivity = (id) => {
    const activity = filteredActivities.find((activity) => activity.id === id);
    setSelectedActivity(activity);
    setActivityModalOpen(true);
  }

  const handleGptSuggestion = async () => {
    setGptLoading(true);
    try {
      const response = await axios.get('/api/activities/suggest-based-on-others', { params: { activitiesIds: selectedActivitiesIds } });
      setSuggestedActivity(response.data);
    } finally {
      setGptLoading(false);
    }
  }

  const columns = [
    { field: 'name', headerName: 'Nombre', flex: mdUp ? 3 : 1 },
    { field: 'recommendedLevels', headerName: 'Niveles', flex: mdUp ? 3 : 1 },
    { field: 'cores', headerName: 'Núcleos', flex: mdUp ? 3 : 1 },
    {
      field: 'actions', headerName: 'Acciones', flex: 1, renderCell: (params) => (
        <Stack direction="row" spacing={1} m={1}>
          <IconButton color="info" onClick={() => handleShowActivity(params.row.id)}><VisibilityOutlined /></IconButton>
          <IconButton color="primary" onClick={() => handleSelectActivity(params.row.id)}><AddOutlined /></IconButton>
        </Stack>
      )
    },
  ];

  const handleCreateActivityFromSuggestion = async () => {
    setCreateLoading(true);
    try {
      const response = await axios.post(`/api/institutions/${institutionId}/activities`, {
        description: suggestedActivity,
        name: 'Nueva experiencia de aprendizaje',
      })
      router.push(`/institutions/${institutionId}/activities/${response.data.id}/edit`);
    } catch {
      setCreateLoading(false);
    }
  };

  if (!features?.includes('createActivitiesFromAI')) {
    return null;
  }

  return (
    <>
      <Drawer
        anchor={mdUp ? 'right' : 'bottom'}
        variant="persistent"
        open={true}
        sx={{
          width: mdUp ? DRAWER_WIDTH : '100%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            borderRadius: 0,
            width: mdUp ? DRAWER_WIDTH : '100%',
            height: mdUp ? '100%' : '35%',
            pt: mdUp ? 5 : 2,
            px: 1,
            pb: 2,
          },
        }}
      >
        <Typography variant="h6" mb={2} textAlign="center">Experiencias seleccionadas</Typography>
        <Stack spacing={1} mb={4}>
          {selectedActivitiesIds.map((id, i) => (
            <Stack key={id} direction="row" justifyContent="space-between" alignItems="center" px={2}>
              <Typography>
                {i + 1}. {filteredActivities.find((activity) => activity.id === id).name}
              </Typography>
              <IconButton color="error" onClick={() => handleUnselectActivity(id)}><CloseOutlined /></IconButton>
            </Stack>
          ))}
        </Stack>
        {gptLoading ? (
          <Button variant="contained" disabled={true} startIcon={<CircularProgress size={16} />}>Robot trabajando para usted</Button>
        ) : (
          <Button variant="contained" disabled={selectedActivitiesIds.length <= 1} onClick={handleGptSuggestion}>Sugerir experiencia nueva</Button>
        )}
      </Drawer>
      <Box
        component="main"
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}
      >
        <Stack>
          <Typography variant="h4" mb={2}>Experiencias públicas</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Searchbar
                fullWidth
                value={filters.searchText}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <UngaSelect
                fullWidth
                multiple
                label="Buscar por nivel"
                labelId="select-filter-level-label"
                name="recommendedLevels"
                id="select-filter-level"
                value={filters.recommendedLevels}
                onChange={handleMultipleSelectChange}
                options={levels}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <UngaSelect
                fullWidth
                multiple
                label="Buscar por núcleo"
                labelId="select-filter-core-label"
                name="cores"
                id="select-filter-core"
                value={filters.cores}
                onChange={handleMultipleSelectChange}
                options={allCores}
              />
            </Grid>
            <Grid item sm={8} />
            <Grid item xs={12} sm={4} display="flex" columnGap={2} justifyContent={{ xs: 'space-between', sm: 'flex-start' }}>
              <Button fullWidth variant="contained" color="info" onClick={handleSearchActivities}>
                Aplicar Filtros
              </Button>
              <Button fullWidth variant="outlined" color="info" onClick={handleClearFilters}>Limpiar filtros</Button>
            </Grid>
          </Grid>
          <Stack mt={2}>
            <DataGrid
              autoHeight
              getRowHeight={() => 'auto'}
              rows={rows}
              columns={columns}
              pageSize={50}
              rowsPerPageOptions={[50]}
            />
          </Stack>
        </Stack>
      </Box>
      <Dialog
        maxWidth="lg"
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      >
        <Box minWidth={window.innerWidth * 0.8} p={4} position="relative">
          <ActivityCard activity={selectedActivity} />
          <IconButton
            onClick={() => setActivityModalOpen(false)}
            sx={{ position: 'absolute', right: 5, top: 5 }}
          >
            <CloseOutlined color="error" />
          </IconButton>
        </Box>
      </Dialog>
      <Dialog
        maxWidth="lg"
        open={Boolean(suggestedActivity)}
      >
        <DialogTitle>Sugerencia de experiencia</DialogTitle>
        <DialogContent>
          <QuillNoSSRWrapper
            theme="snow"
            value={suggestedActivity}
            onChange={setSuggestedActivity}
            formats={[
              'header',
              'bold', 'italic', 'underline', 'strike', 'blockquote',
              'list', 'bullet', 'indent',
              'link', 'image',
            ]}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestedActivity('')}>Cerrar</Button>
          <LoadingButton
            variant="contained"
            loading={createLoading}
            onClick={handleCreateActivityFromSuggestion}
          >
            Crear experiencia
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}