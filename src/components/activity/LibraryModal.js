import { Close, FilterList, FilterListOff } from "@mui/icons-material";
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, Typography, useMediaQuery } from "@mui/material";
import useActivitiesFilters from "src/hooks/useActivitiesFilters";
import Searchbar from "../utils/Searchbar";
import { Fragment, useEffect, useState } from "react";
import ActivityCardSmall from "./ActivityCardSmall";
import axios from "axios";
import UngaSelect from "../utils/UngaSelect";
import UngaSelectObjectives from "../utils/UngaSelectObjectives";
import { initial } from "lodash";
import { LoadingButton } from "@mui/lab";
import ActivityCardSmallForParents from "./ActivityCardSmallForParents";
import ParentsTranslationService from "services/translation/parents";

const PUBLIC_ACTIVITIES_PATH = `/api/activities?publiclyAvailable=true&`;
const PARENTS_ACTIVITIES_PATH = `/api/activities?publiclyAvailable=true&forParents=true&`;

export default function ActivitiesLibraryModal({ open, onClose, forParents }) {
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [after, setAfter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMoreLoading, setShowMoreLoading] = useState(false);
  const {
    filters,
    clearFilters,
    handleSearchChange,
    handleMultipleSelectChange,
    addFiltersToPath,
    toggleFilters,
    cores,
    levels,
    curricularObjectives,
    themes,
    showFilters,
    isFiltering,
  } = useActivitiesFilters();

  const fetchActivities = async ({ initial = true }) => {
    const path = forParents ? PARENTS_ACTIVITIES_PATH : PUBLIC_ACTIVITIES_PATH;
    const searchPath = addFiltersToPath(path, true);
    const searchResults = await axios.get(searchPath);
    if (initial) setActivities(searchResults.data.data);
    setFilteredActivities(searchResults.data.data);
    setAfter(searchResults.data.after || null)
    setLoading(false);
  }

  useEffect(() => {
    fetchActivities({ initial: true });
  }, [])

  const handleClearFilters = () => {
    setFilteredActivities(activities);
    clearFilters();
  }

  const handleShowMore = async () => {
    setShowMoreLoading(true);
    let path = forParents ? addFiltersToPath(PARENTS_ACTIVITIES_PATH) : addFiltersToPath(PUBLIC_ACTIVITIES_PATH);
    // Prisma cursor-based pagination: use the last item's ID as cursor
    if (after) {
      path += `&after=${after}`;
    }

    try {
      const searchResults = await axios.get(path);
      setFilteredActivities((oldValues) => [...oldValues, ...searchResults.data.data]);
      setAfter(searchResults.data.after || null)
    } finally {
      setShowMoreLoading(false);
    }
  }


  const handleSearchActivities = async () => {
    if (!isFiltering()) {
      handleClearFilters();
      return;
    }

    setLoading(true);
    await fetchActivities({ initial: false });
    setLoading(false);
  }

  const getActivitiesContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      );
    }

    if (filteredActivities.length === 0)
      return (
        <Typography>
          Todavía no tenemos experiencias que cumplan con todos tus filtros
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
            <Fragment key={activity.id}>
              {forParents ? (
                <ActivityCardSmallForParents activity={activity} />
              ) : (
                <ActivityCardSmall activity={activity} watchOnly forParents />
              )}
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
    )
  }

  return (
    <Dialog
      fullScreen
      open={open}
    >
      <DialogTitle>Biblioteca de experiencias Unga</DialogTitle>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', right: 5, top: 5 }}
      >
        <Close color="error" />
      </IconButton>
      <DialogContent sx={{ pt: 1 }}>
        <Grid container rowGap={{ xs: 1, sm: 0 }} spacing={{ xs: 0, sm: 2 }}>
          {forParents ? (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <UngaSelect
                  fullWidth
                  multiple
                  label="Buscar por edad"
                  labelId="select-filter-level-label"
                  name="recommendedLevels"
                  id="select-filter-level"
                  value={filters.recommendedLevels}
                  onChange={handleMultipleSelectChange}
                  options={levels.map((level) => ({
                    ...level,
                    name: ParentsTranslationService.getAgesFromLevels([level])
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <UngaSelect
                  fullWidth
                  multiple
                  label="Buscar por habilidad"
                  labelId="select-filter-core-label"
                  name="cores"
                  id="select-filter-core"
                  value={filters.cores}
                  onChange={handleMultipleSelectChange}
                  options={cores.map((core) => ({
                    ...core,
                    name: ParentsTranslationService.coresTranslations[core.name]
                  }))}
                />
              </Grid>
            </>
          ) : (
            <>
              {!smUp && (
                <Grid item xs={12}>
                  {showFilters ? (
                    <Button
                      fullWidth
                      onClick={toggleFilters}
                      startIcon={<FilterListOff />}
                      sx={{ mb: 2 }}
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
              {(showFilters || smUp) && (
                <Grid item xs={12}>
                  <Grid container id="filters" rowGap={{ xs: 2, sm: 0 }} spacing={{ xs: 0, sm: 2 }}>
                    <Grid item xs={12} sm={12} md={4}>
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
                  </Grid>
                </Grid>
              )}
            </>
          )}
          <Grid item sm={6} md={4} />
          <Grid item xs={12} sm={6} md={4} display="flex" columnGap={2} justifyContent={{ xs: 'space-between', sm: 'flex-start' }}>
            <Button fullWidth variant="outlined" color="info" onClick={handleClearFilters}>Limpiar filtros</Button>
            <Button fullWidth variant="contained" color="info" onClick={handleSearchActivities}>
              Aplicar Filtros
            </Button>
          </Grid>
          <Grid item xs={12} mt={2}>
            <Divider />
          </Grid>
          <Grid item xs={12} mt={2}>
            {getActivitiesContent()}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}