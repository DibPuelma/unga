import { LoadingButton } from "@mui/lab";
import { Box, Button, CircularProgress, FormControlLabel, Grid, Stack, Switch, Tab, Tabs, Typography, useMediaQuery, useTheme } from "@mui/material";
import axios from "axios";
import moment from 'moment';
import { getInstitutionCoresWithObjectives } from "db/core";
import { getLevelForClassroom, getNonHeterogeneousLevels, HETEROGENEOUS_TO_NON_HETEROGENEUS } from "db/level";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import { MixpanelContext } from "services/MixpanelContext";
import ActivityCardSmall from "src/components/activity/ActivityCardSmall";
import Searchbar from "src/components/utils/Searchbar";
import UngaSelect from "src/components/utils/UngaSelect";
import { UserContext } from "src/context/UserContext";
import Head from "next/head";
import { Add, FilterList, FilterListOff } from "@mui/icons-material";
import UngaSelectObjectives from "src/components/utils/UngaSelectObjectives";
import { STATUS } from "react-joyride";
import UngaJoyride from "src/components/utils/UngaJoyride";
import useActivitiesFilters from "src/hooks/useActivitiesFilters";
import useNoPlanWarning from "src/hooks/useNoPlanWarning";

const nameMapper = ((item) => item.name)

import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);
  const { user: { institution } } = session;
  const institutionId = institution.id;
  const { query: { classroomId } } = context;
  const classroomLevel = classroomId ? await getLevelForClassroom(classroomId) : null;
  const levels = await getNonHeterogeneousLevels();

  return {
    props: serializeForNextProps({
      levels,
      classroomLevel,
    })
  }
};

export default function Activities({
  levels,
  classroomLevel,
}) {
  const router = useRouter();
  const { query: { classroomId, institutionId, date } } = router;
  const handleNoPlanWarning = useNoPlanWarning({
    title: 'No puedes crear más de 5 experiencias',
    description: 'Para poder crear más, debes comenzar tu prueba gratuita registrando un medio de pago',
  })
  const {
    selectedClassroom,
    institution: { features },
    user,
    totalActivitiesCreated,
    setTotalActivitiesCreated,
    userHasPlan,
  } = useContext(UserContext);
  const recommendedLevels = useMemo(() => selectedClassroom ?
    levels.filter((level) => (
      level.id === selectedClassroom.level.id ||
      HETEROGENEOUS_TO_NON_HETEROGENEUS[selectedClassroom.level.name]?.includes(level.name)
    )).map((level) => level.id) : [], [selectedClassroom]);
  const {
    trackActivityIndexPageView,
    trackPlanActivity,
    trackPlanPublicActivity,
    trackOnboardingStep,
    trackCreateActivity,
  } = useContext(MixpanelContext);
  const INSTITUTION_ACTIVITIES_PATH = `/api/institutions/${institutionId}/activities?`;
  const PUBLIC_ACTIVITIES_PATH = `/api/activities?publiclyAvailable=true&`;
  const COMMUNITY_ACTIVITIES_PATH = `/api/activities?openToCommunity=true&`;
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  const [initialData, setInitialData] = useState({
    institutionActivities: [],
    institutionActivitiesAfter: null,
    publicActivities: [],
    publicActivitiesAfter: null,
    communityActivities: [],
    communityActivitiesAfter: null,
  })
  const [filteredPublicActivities, setFilteredPublicActivities] = useState([]);
  const [filteredCommunityActivities, setFilteredCommunityActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [afterPublic, setAfterPublic] = useState(null);
  const [afterCommunity, setAfterCommunity] = useState(null);
  const [after, setAfter] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [userOnlyActivities, setUserOnlyActivities] = useState(true);
  const [planActivitiesStatus, setPlanActivitiesStatus] = useState({
    loading: false,
    error: false,
  });
  const [loading, setLoading] = useState(true);
  const [showMoreLoading, setShowMoreLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showFilters, setShowFilters] = useState(smUp);
  const [firstActivityChecked, setFirstActivityChecked] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const {
    filters,
    clearFilters,
    handleSearchChange,
    handleMultipleSelectChange,
    addFiltersToPath,
    isFiltering,
    themes,
    curricularObjectives,
    cores,
  } = useActivitiesFilters({ recommendedLevels, allLevels: levels });
  const title = classroomId && date ?
    'Selecciona o crea una experiencia' :
    'Biblioteca de experiencias';

  useEffect(() => setShowFilters(smUp), [smUp]);

  useEffect(() => {
    const initialDataFetch = async () => {
      await searchInstitutionActivities({ initial: true, userOnly: true });
      await searchPublicActivities({ initial: true });
      await searchCommunityActivities({ initial: true });
      setLoading(false);
    };
    initialDataFetch();
    // trackActivityIndexPageView();
  }, []);

  const handleuserOnlyActivitiesChange = async ({ target: { checked } }) => {
    setLoading(true);
    setUserOnlyActivities(checked);
    await searchInstitutionActivities({ userOnly: checked });
    setLoading(false);
  }

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const handleSelectActivity = (checked, newActivity) => {
    setSelectedActivities((oldActivities) => {
      if (checked) {
        return [...oldActivities, newActivity];
      } else {
        const index = oldActivities.findIndex((activity) => activity.id === newActivity.id);
        return [
          ...oldActivities.slice(0, index),
          ...oldActivities.slice(index + 1, oldActivities.length),
        ];
      }
    })
  };

  const handleDeleteActivity = (id) => {
    setTotalActivitiesCreated((oldTotal) => oldTotal - 1);
    setFilteredActivities((oldActivities) => oldActivities.filter((activity) => activity.id !== id));
  }

  const searchInstitutionActivities = async (options = { initial: false, userOnly: true }) => {
    const { initial, userOnly } = options;
    if (initial) {
      const initialResults = await axios.get(`${INSTITUTION_ACTIVITIES_PATH}`)
      setInitialData((oldValue) => ({
        ...oldValue,
        institutionActivities: initialResults.data.data,
        institutionActivitiesAfter: initialResults.data.after || null,
      }))
    }
    let searchPath = addFiltersToPath(INSTITUTION_ACTIVITIES_PATH);
    if (userOnly) searchPath += `&userId=${user.id}`;
    const searchResults = await axios.get(searchPath);
    setFilteredActivities(searchResults.data.data);
    setAfter(searchResults.data.after || null);
  };

  const searchPublicActivities = async (options = { initial: false }) => {
    const { initial } = options;
    if (initial) {
      const initialResults = await axios.get(PUBLIC_ACTIVITIES_PATH)
      setInitialData((oldValue) => ({
        ...oldValue,
        publicActivities: initialResults.data.data,
        publicActivitiesAfter: initialResults.data.after || null,
      }))
    }
    const searchPath = addFiltersToPath(PUBLIC_ACTIVITIES_PATH, true);
    const searchResults = await axios.get(searchPath);
    setFilteredPublicActivities(searchResults.data.data);
    setAfterPublic(searchResults.data.after || null)
  };

  const searchCommunityActivities = async (options = { initial: false }) => {
    const { initial } = options;
    if (initial) {
      const initialResults = await axios.get(COMMUNITY_ACTIVITIES_PATH)
      setInitialData((oldValue) => ({
        ...oldValue,
        communityActivities: initialResults.data.data,
        communityActivitiesAfter: initialResults.data.after || null,
      }))
    }
    const searchPath = addFiltersToPath(COMMUNITY_ACTIVITIES_PATH, true);
    const searchResults = await axios.get(searchPath);
    setFilteredCommunityActivities(searchResults.data.data);
    setAfterCommunity(searchResults.data.after || null)
  };

  const handleSearchActivities = async () => {
    if (!isFiltering()) {
      handleClearFilters();
      return;
    }

    setLoading(true);
    setSelectedActivities([]);
    await searchInstitutionActivities();
    await searchPublicActivities();
    await searchCommunityActivities();
    setLoading(false);
  }

  const handleAddActivities = async ({ fromOnboarding = false }) => {
    setPlanActivitiesStatus({ loading: true })
    const promises = [];
    for (let i = 0; i < selectedActivities.length; i++) {
      const activity = selectedActivities[i];
      promises.push(
        axios.post(`/api/institutions/${institutionId}/activities/${activity.id}/plan`, {
          classroom: classroomId,
          date,
        })
      );
      if (activity.publiclyAvailable) {
        // trackPlanPublicActivity(
        //   activity.sponsorInstitution.name,
        //   activity.name,
        //   selectedClassroom.name,
        //   moment(date),
        //   activity.cores.map(nameMapper),
        //   activity.objectives.map(nameMapper),
        //   activity.subObjectives.map(nameMapper),
        //   activity.curricularObjectives.map(nameMapper),
        //   activity.recommendedLevels.map(nameMapper),
        //   activity.materials.length,
        //   Object.keys(activity.assets).length,
        // )
      } else {
        // trackPlanActivity(
        //   activity.name,
        //   selectedClassroom.name,
        //   moment(date),
        //   activity.cores.map(nameMapper),
        //   activity.objectives.map(nameMapper),
        //   activity.subObjectives.map(nameMapper),
        //   activity.curricularObjectives.map(nameMapper),
        //   activity.recommendedLevels.map(nameMapper),
        //   activity.materials.length,
        //   Object.keys(activity.assets).length,
        // );
      }
    }
    try {
      await Promise.all(promises);
      router.replace(`/classes/${classroomId}/lesson-plan?startDate=${date}${fromOnboarding ? '&onboardingType=end' : ''}`);
    } catch (error) {
      console.error(error);
      setPlanActivitiesStatus({ error: true });
    }
  }

  const handleClearFilters = () => {
    const {
      institutionActivities,
      institutionActivitiesAfter,
      publicActivities,
      publicActivitiesAfter,
      communityActivities,
      communityActivitiesAfter,
    } = initialData;

    clearFilters();
    setFilteredActivities(institutionActivities);
    setAfter(institutionActivitiesAfter);
    setFilteredPublicActivities(publicActivities);
    setAfterPublic(publicActivitiesAfter);
    setFilteredCommunityActivities(communityActivities);
    setAfterCommunity(communityActivitiesAfter);
  }

  const handleInstitutionShowMore = () =>
    handleShowMore(INSTITUTION_ACTIVITIES_PATH, after, setFilteredActivities, setAfter);

  const handlePublicShowMore = () =>
    handleShowMore(PUBLIC_ACTIVITIES_PATH, afterPublic, setFilteredPublicActivities, setAfterPublic);

  const handleCommunityShowMore = () =>
    handleShowMore(COMMUNITY_ACTIVITIES_PATH, afterCommunity, setFilteredCommunityActivities, setAfterCommunity);

  const handleShowMore = async (baseUrl, after, updateActivities, updateAfter) => {
    setShowMoreLoading(true);
    let path = addFiltersToPath(baseUrl);
    // Prisma cursor-based pagination: use the last item's ID as cursor
    if (after) {
      path += `&after=${after}`;
    }

    try {
      const searchResults = await axios.get(path);
      updateActivities((oldValues) => [...oldValues, ...searchResults.data.data]);
      updateAfter(searchResults.data.after || null)
    } finally {
      setShowMoreLoading(false);
    }
  }

  const showActivitiesContent = (allActivities, filteredActivities, handleShowMore, after) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      );
    }

    if (allActivities.length === 0) {
      return (
        <Typography variant="body2">
          No tienes experiencias. Crea una presionando el botón "Crear nueva experiencia" de arriba.
        </Typography>
      )
    }
    if (filteredActivities.length === 0)
      return (
        <Typography>
          Ninguna experiencia cumple con los filtros
        </Typography>
      );

    return (
      <>
        <Box
          maxWidth="100vw"
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
          columnGap={2}
          rowGap={2}
        >
          {filteredActivities.map((activity, i) => (
            <Box key={activity.id} id={i === 0 ? 'first-activity' : null}>
              <ActivityCardSmall
                activity={activity}
                forceCheck={i === 0 && firstActivityChecked}
                onSelect={classroomId && date ? handleSelectActivity : null}
                onDelete={handleDeleteActivity}
              />
            </Box>
          ))}
        </Box>
        {after && (
          <LoadingButton
            fullWidth
            onClick={handleShowMore}
            sx={{ alignSelf: 'center', mt: 3 }}
            loading={showMoreLoading}
          >
            Cargar más experiencias
          </LoadingButton>
        )}
      </>
    )
  }

  const toggleFilters = () => setShowFilters((oldValue) => !oldValue);

  const steps = [
    {
      target: '#library-container',
      content: 'Esta es la biblioteca de experiencias, aquí encontrarás todas las experiencias de nuestra biblioteca y las que tú vayas agregando.',
      disableBeacon: true, ay: true,
    },
    // {
    //   target: '#create-activity-button',
    //   content: 'Con este botón puedes crear experiencias.',
    //   disableBeacon: true,
    // },
    // {
    //   target: '#filters',
    //   content: 'Con los filtros puedes buscar por nombre, nivel, núcleo u objetivo de las bases curriculares.',
    //   disableBeacon: true,
    // },
    {
      target: '#institution-activities-tab',
      content: 'Aquí se guardan todas las experiencias de aprendizaje que crees. En estos momentos está vacío.',
      disableBeacon: true,
      placement: 'right'
    },
    {
      target: '#unga-activities-tab',
      content: 'Aquí se muestran las experiencias de aprendizaje Unga. Las actualizamos constantemente.',
      disableBeacon: true,
      placement: 'right'
    },
    {
      target: '#first-activity',
      content: 'Esta es una experiencia de nuestra biblioteca. Si te fijas, la seleccionamos clickeando en el recuadro de arriba a la izquierda.',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '#add-activities-button',
      content: "Una vez que seleccionas las experiencias que quieres, con este botón las agregas al calendario. Haz click en 'Finalizar' para verlo en acción.",
      disableBeacon: true,
    },
  ]

  const handleJoyrideCallback = (data) => {
    const { status, step: { target }, type } = data;
    if (target === '#unga-activities-tab') {
      setTabValue(1);
    }
    if (target === '#first-activity') {
      if (selectedActivities.length === 0) {
        handleSelectActivity(true, filteredPublicActivities[0]);
        setFirstActivityChecked(true);
      }
    }
    if (status === STATUS.FINISHED && type === 'tour:end') {
      // trackOnboardingStep('Library To Lesson Plan');
      handleAddActivities({ fromOnboarding: true });
    }
  }

  const getRecommendedLevels = () => {
    let levelIdFromClassroom = null;
    let levelNameFromClassroom = null;
    if (classroomLevel) {
      levelIdFromClassroom = classroomLevel.id;
      levelNameFromClassroom = classroomLevel.name;
      return levels.filter((level) => (
        level.id === levelIdFromClassroom ||
        HETEROGENEOUS_TO_NON_HETEROGENEUS[levelNameFromClassroom]?.includes(level.name)
      )).map((level) => level.id)
    }
    return [];
  }

  const handleCreateActivity = async () => {
    if (!userHasPlan && totalActivitiesCreated >= 5) {
      handleNoPlanWarning();
      return;
    }
    setCreateLoading(true);
    const recommendedLevels = getRecommendedLevels();
    try {
      const response = await axios.post(`/api/institutions/${institutionId}/activities`, {
        recommendedLevels,
        name: '',
      })
      setTotalActivitiesCreated((oldValue) => oldValue + 1);
      // trackCreateActivity();
      const params = classroomId && date
        ? `?returnUrl=${window.location.origin}/classes/${classroomId}/lesson-plan?startDate=${date}&classroomId=${classroomId}&date=${date}`
        : '';
      router.push(`/institutions/${institutionId}/activities/${response.data.id}/edit${params}`);
    } catch {
      setCreateLoading(false);
    }
  }

  return (
    <>
      <Box id="library-container" position="absolute" top="10%" left="50%" />
      {features?.includes('ungaExperiences') && classroomId && (
        <UngaJoyride
          disableScrolling
          steps={steps}
          callback={handleJoyrideCallback}
        />
      )}
      <Head><title>{title}</title></Head>
      <Stack spacing={2} mb={4} mt={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} display="flex" justifyContent={{ xs: 'inherit', sm: 'flex-end' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} width="100%" justifyContent="space-between">
              <FormControlLabel
                sx={{ ml: 0, justifyContent: { xs: 'center', sm: 'flex-end' } }}
                control={
                  <Switch
                    checked={userOnlyActivities}
                    onChange={handleuserOnlyActivitiesChange}
                  />}
                label="Mostrar solo mis experiencias"
                labelPlacement='start'
              />
              <LoadingButton
                startIcon={<Add />}
                variant="contained"
                color="primary"
                sx={{ mb: 0.2 }}
                onClick={handleCreateActivity}
                loading={createLoading}
                id="create-activity-button"
              >
                Crear una nueva experiencia
              </LoadingButton>
            </Stack>
          </Grid>
          {!smUp && (
            <Grid item xs={12}>
              {showFilters ? (
                <Button
                  fullWidth
                  onClick={toggleFilters}
                  startIcon={<FilterListOff />}
                >
                  Ocultar filtros
                </Button>
              ) : (
                <Button
                  fullWidth
                  onClick={toggleFilters}
                  startIcon={<FilterList />}
                  id="filters"
                >
                  Filtrar experiencias
                </Button>
              )}
            </Grid>
          )}
          {showFilters && (
            <Grid item xs={12}>
              <Grid container id="filters" spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Searchbar
                    fullWidth
                    value={filters.searchText}
                    onChange={handleSearchChange}
                    placeholder="Buscar por nombre"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <UngaSelect
                    fullWidth
                    multiple
                    label="Buscar por temática"
                    labelId="select-filter-theme-label"
                    name="themes"
                    id="select-filter-theme"
                    value={filters.themes}
                    onChange={handleMultipleSelectChange}
                    options={themes}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
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
                <Grid item xs={12} sm={6} md={4}>
                  <UngaSelect
                    fullWidth
                    multiple
                    label="Buscar por núcleo"
                    labelId="select-filter-core-label"
                    name="cores"
                    id="select-filter-core"
                    value={filters.cores}
                    onChange={handleMultipleSelectChange}
                    options={cores}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <UngaSelectObjectives
                    fullWidth
                    multiple
                    label="Buscar por objetivo de las bases"
                    labelId="select-filter-curricular-objective-label"
                    name="curricularObjectives"
                    id="select-filter-curricular-objective"
                    value={filters.curricularObjectives}
                    onChange={handleMultipleSelectChange}
                    objectives={curricularObjectives}
                    filteredCores={filters.cores}
                    filteredLevels={filters.recommendedLevels}
                    allCores={cores}
                  />
                </Grid>
                {/* <Grid item xs={12} sm={6} md={4}>
                <UngaSelectObjectives
                  fullWidth
                  multiple
                  label="Buscar por indicador del informe"
                  labelId="select-filter-objective-label"
                  name="objectives"
                  id="select-filter-objective"
                  value={filters.objectives}
                  onChange={handleMultipleSelectChange}
                  objectives={objectives}
                  filteredCores={filters.cores}
                  filteredLevels={filters.recommendedLevels}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <UngaSelectObjectives
                  fullWidth
                  multiple
                  label="Buscar por indicador de evaluación"
                  labelId="select-filter-sub-objective-label"
                  name="subObjectives"
                  id="select-filter-sub-objective"
                  value={filters.subObjectives}
                  onChange={handleMultipleSelectChange}
                  objectives={subObjectives}
                  filteredCores={filters.cores}
                  filteredLevels={filters.recommendedLevels}
                />
              </Grid> */}
                <Grid item sm={6} md={4} />
                <Grid item xs={12} sm={6} md={4} display="flex" columnGap={2} justifyContent={{ xs: 'space-between', sm: 'flex-start' }}>
                  <Button fullWidth variant="contained" color="info" onClick={handleSearchActivities}>
                    Aplicar Filtros
                  </Button>
                  <Button fullWidth variant="outlined" color="info" onClick={handleClearFilters}>Limpiar filtros</Button>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Tabs de configuración" variant="scrollable">
            <Tab label="Experiencias del centro" id="institution-activities-tab" />
            <Tab
              label="Experiencias certificadas Unga"
              id="unga-activities-tab"
              sx={{ display: features?.includes('ungaExperiences') ? 'inline-flex' : 'none' }}
            />
            {/* <Tab label="Experiencias de la comunidad" id="community-activities-tab" /> */}
          </Tabs>
        </Box>
        <Box display={tabValue === 0 ? 'block' : 'none'}>
          {showActivitiesContent(initialData.institutionActivities, filteredActivities, handleInstitutionShowMore, after)}
        </Box>
        <Box display={tabValue === 1 ? 'block' : 'none'}>
          {showActivitiesContent(initialData.publicActivities, filteredPublicActivities, handlePublicShowMore, afterPublic)}
        </Box>
        <Box display={tabValue === 2 ? 'block' : 'none'}>
          {showActivitiesContent(initialData.communityActivities, filteredCommunityActivities, handleCommunityShowMore, afterCommunity)}
        </Box>
      </Stack>
      {selectedActivities.length > 0 && (
        <Box
          position="sticky"
          bottom={4}
          backgroundColor="white"
          p={2}
          zIndex={2}
          borderRadius="10px"
        >
          <LoadingButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleAddActivities}
            loading={planActivitiesStatus.loading}
            id="add-activities-button"
          >
            Agregar experiencias
          </LoadingButton>
        </Box >
      )}
    </>
  );
};