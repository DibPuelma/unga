import { ArrowBackIosNewOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, CircularProgress, IconButton, Paper, Stack, Typography } from "@mui/material";
import axios from "axios";
import { getPublicCores } from "db/core";
import { getNonHeterogeneousLevels } from "db/level";
import { Fragment, useEffect, useState } from "react";
import { isAuthorized } from "services/Authorization";
import ParentsTranslationService from "services/translation/parents";
import ActivityCardSmallForParents from "src/components/activity/ActivityCardSmallForParents";
import UngaCircularProgress from "src/components/utils/UngaCircularProgress";
import useActivitiesFilters from "src/hooks/useActivitiesFilters";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const levels = await getNonHeterogeneousLevels();
  const cores = await getPublicCores();
  return {
    props: {
      levels,
      cores,
    }
  }
}

function pushUrl(title, url) {
  if (typeof (history.pushState) != "undefined") {
    var obj = {
      Title: title,
      Url: url
    };
    history.pushState(obj, obj.Title, obj.Url);
  }
}



const PARENTS_ACTIVITIES_PATH = `/api/activities?publiclyAvailable=true&forParents=true&`;

export default function ParentsIndex({ levels, cores }) {
  const [step, setStep] = useState(0);
  const [activities, setActivities] = useState([]);
  const [after, setAfter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoreLoading, setShowMoreLoading] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState({});

  const { filters, setFilters, addFiltersToPath } = useActivitiesFilters({ allCores: cores, allLevels: levels });

  useEffect(() => {
    window.onpopstate = function (event) {
      if (event) {
        if (Object.keys(activityModalOpen).length > 0) {
          setActivityModalOpen({});
        }
        const newStep = event.state.Url ? parseInt(event.state.Url[event.state.Url.length - 1], 10) : parseInt(event.state.url[event.state.url.length - 1], 10);
        if (isNaN(newStep)) setStep(0);
        else setStep(newStep);
      }
    }
  }, [activityModalOpen]);

  useEffect(() => {
    const handleFetchActivities = async () => {
      setLoading(true);
      await fetchActivities();
      setLoading(false);
    }
    if (filters.recommendedLevels.length > 0 && filters.cores.length > 0) handleFetchActivities();
  }, [filters])

  const fetchActivities = async () => {
    const path = PARENTS_ACTIVITIES_PATH;
    const searchPath = addFiltersToPath(path, true);
    const searchResults = await axios.get(searchPath);
    setActivities(searchResults.data.data);
    setAfter(searchResults.data.after || null)
    setLoading(false);
  }

  const handleSelectLevel = (levelId) => {
    setFilters((oldValue) => ({
      ...oldValue,
      recommendedLevels: [levelId],
    }))
    pushUrl('Seleccion de habilidades', '/parents/1')
    setStep(1);
  }

  const handleSelectCore = async (coreId) => {
    setFilters((oldValue) => ({
      ...oldValue,
      cores: [coreId],
    }))
    pushUrl('Seleccion de experiencias', '/parents/2')
    setStep(2);
  }

  const handleBack = () => {
    history.back();
    // pushUrl('', `/parents/${step - 1}`);
    // handleStepChange(step - 1);
  }

  const handleShowMore = async () => {
    setShowMoreLoading(true);
    let path = addFiltersToPath(PARENTS_ACTIVITIES_PATH, true);
    // Prisma cursor-based pagination: use the last item's ID as cursor
    if (after) {
      path += `&after=${after}`;
    }

    try {
      const searchResults = await axios.get(path);
      setActivities((oldValues) => [...oldValues, ...searchResults.data.data]);
      setAfter(searchResults.data.after || null)
    } finally {
      setShowMoreLoading(false);
    }
  }

  const handleActivityShow = (activityId) => {
    setActivityModalOpen({ [activityId]: true });
    pushUrl('Seleccion de experiencias', '/parents/3')
    setStep(3);
  }

  const handleActivityHide = (activityId) => {
    setActivityModalOpen({ [activityId]: false });
    history.back();
  }

  if (step === 0) {
    return (
      <>
        <Typography variant="h6" mb={3}>¿Para qué edad quieres buscar actividades?</Typography>
        <Stack spacing={2}>
          {levels.map((level) => (
            <Paper key={level.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleSelectLevel(level.id)}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{ParentsTranslationService.getAgesFromLevels([level])}</Typography>
                <ChevronRightOutlined />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <Stack direction="row" alignItems="center" columnGap={2} mb={4}>
          <IconButton onClick={handleBack}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography variant="h6">¿Qué habilidades quieres potenciar?</Typography>
        </Stack>
        <Stack spacing={2}>
          {cores.map((core) => (
            <Paper key={core.id} sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleSelectCore(core.id)}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography>{ParentsTranslationService.coresTranslations[core.name]}</Typography>
                <ChevronRightOutlined />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </>
    )
  }

  if (step === 2 || step === 3) {
    if (loading) {
      return (
        <UngaCircularProgress text="Buscando actividades..." />
      );
    }

    return (
      <>
        <Stack direction="row" alignItems="center" columnGap={2} mb={4}>
          <IconButton onClick={handleBack}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography variant="h6">Actividades encontradas</Typography>
        </Stack>
        {activities.length === 0 ? (
          <Typography>
            Todavía no tenemos actividades para esas edades y esa habilidad
          </Typography>
        ) : (
          <>
            <Box
              maxWidth="100vw"
              display="grid"
              gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
              columnGap={2}
              rowGap={2}
            >
              {activities.map((activity) => (
                <Fragment key={activity.id}>
                  <ActivityCardSmallForParents
                    onShow={() => handleActivityShow(activity.id)}
                    onClose={() => handleActivityHide(activity.id)}
                    activity={activity}
                    activityModalOpen={activityModalOpen[activity.id]}
                  />
                </Fragment>
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
        )}
      </>
    )
  }
}