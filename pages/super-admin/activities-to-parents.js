import { AutoAwesomeRounded, Close, SwitchAccessShortcutOutlined, VisibilityOutlined } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Dialog, Grid, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { searchActivities } from "db/activity";
import Head from "next/head";
import { useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import { nameMapper } from "src/helpers/parsers";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const publicActivities = await searchActivities({ publiclyAvailable: true, pageSize: 1000 });
  const reducedActivities = publicActivities.data.map((activity) => ({
    id: activity.id,
    name: activity.name,
    recommendedLevels: activity.recommendedLevels,
    cores: activity.cores,
    descriptionForParents: activity.descriptionForParents ? activity.descriptionForParents : null,
    description: activity.description,
  }))
  return {
    props: {
      publicActivities: reducedActivities,
    },
  }
}

export default function ActivitiesToParents({ publicActivities }) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const [activityToShow, setActivityToShow] = useState(null)
  const [dynamicActivities, setDynamicActivities] = useState(publicActivities);
  const [loadingGenerateParentDescription, setLoadingGenerateParentDescription] = useState(false)
  const rows = useMemo(() => dynamicActivities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    recommendedLevels: activity.recommendedLevels.map(nameMapper).join(', '),
    cores: activity.cores.map(nameMapper).join(', '),
    hasParentsDescription: Boolean(activity.descriptionForParents),
  })), [dynamicActivities])

  const columns = [
    { field: 'name', headerName: 'Nombre', flex: mdUp ? 3 : 1 },
    { field: 'recommendedLevels', headerName: 'Niveles', flex: mdUp ? 3 : 1 },
    { field: 'cores', headerName: 'Núcleos', flex: mdUp ? 3 : 1 },
    { field: 'hasParentsDescription', headerName: 'Para padres', flex: 1 },
    {
      field: 'actions', headerName: 'Acciones', flex: 1, renderCell: (params) => (
        <Stack direction="row" spacing={1} m={1}>
          <IconButton color="info" onClick={() => handleShowActivity(params.row.id)}><VisibilityOutlined /></IconButton>
        </Stack>
      )
    },
  ];

  const handleShowActivity = (activityId) => {
    const selectedActivity = publicActivities.find((activity) => activity.id === activityId);
    setActivityToShow(selectedActivity)
  }

  const handleGenerateParentDescription = async () => {
    setLoadingGenerateParentDescription(true);
    try {
      const response = await axios.patch(`/api/activities/${activityToShow.id}/generate-parent-description`)
      setActivityToShow(response.data);
      const newActivities = [...dynamicActivities]
      const activityIndex = newActivities.findIndex((activity) => activity.id === activityToShow.id);
      newActivities[activityIndex] = response.data;
      setDynamicActivities(newActivities);
    } finally {
      setLoadingGenerateParentDescription(false);
    }
  }

  return (
    <>
      <Head><title>Transformar actividades</title></Head>
      <DataGrid
        autoHeight
        getRowHeight={() => 'auto'}
        rows={rows}
        columns={columns}
        pageSize={50}
        rowsPerPageOptions={[50]}
      />
      {Boolean(activityToShow) && (
        <Dialog fullScreen open={Boolean(activityToShow)} onClose={() => setActivityToShow(null)}>
          <Box position="relative">
            <Grid container spacing={4} p={4}>
              <Grid item xs={12}>
                <Typography variant="h4">{activityToShow.name}</Typography>
                <Typography>Id de la experiencia: {activityToShow.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" mb={2}>Descripción para educadoras</Typography>
                <Box
                  fontSize={12}
                  dangerouslySetInnerHTML={{ __html: activityToShow.description }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" mb={2}>Descripción para padres</Typography>
                {activityToShow.descriptionForParents ? (
                  <Box
                    fontSize={12}
                    mb={4}
                    dangerouslySetInnerHTML={{ __html: activityToShow.descriptionForParents }}
                  />
                ) : (
                  <Typography textAlign="center" mb={2}>No hay descripción para padres</Typography>
                )}
                <Stack alignItems="center">
                  <LoadingButton
                    variant="contained"
                    startIcon={<AutoAwesomeRounded />}
                    onClick={handleGenerateParentDescription}
                    loading={loadingGenerateParentDescription}
                  >
                    {activityToShow.descriptionForParents ? 'Generar nueva descripción para padres' : 'Generar descripción para padres'}
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
            <IconButton
              onClick={() => setActivityToShow(null)}
              sx={{ position: 'absolute', right: 5, top: 5 }}
            >
              <Close color="error" />
            </IconButton>
          </Box>
        </Dialog>
      )}
    </>
  )
}