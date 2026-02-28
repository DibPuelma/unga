import { Close, EditOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, Dialog, Grid, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { searchActivities } from "db/activity";
import Head from "next/head";
import { useMemo, useState } from "react";
import { isAuthorized } from "services/Authorization";
import Link from "src/Link";
import { nameMapper } from "src/helpers/parsers";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const draftActivities = await searchActivities({ draft: true, pageSize: 1000 });
  const reducedActivities = draftActivities.data.map((activity) => ({
    id: activity.id,
    name: activity.name,
    recommendedLevels: activity.recommendedLevels,
    cores: activity.cores,
    description: activity.description,
  }))
  return {
    props: {
      draftActivities: reducedActivities,
    },
  }
}

export default function DraftActivities({ draftActivities }) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const [activityToShow, setActivityToShow] = useState(null)
  const rows = useMemo(() => draftActivities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    recommendedLevels: activity.recommendedLevels.map(nameMapper).join(', '),
    cores: activity.cores.map(nameMapper).join(', '),
    hasParentsDescription: Boolean(activity.descriptionForParents),
  })), [draftActivities])

  const columns = [
    { field: 'name', headerName: 'Nombre', flex: mdUp ? 3 : 1 },
    { field: 'recommendedLevels', headerName: 'Niveles', flex: mdUp ? 3 : 1 },
    { field: 'cores', headerName: 'Núcleos', flex: mdUp ? 3 : 1 },
    {
      field: 'actions', headerName: 'Acciones', flex: 1, renderCell: (params) => (
        <Stack direction="row" spacing={1} m={1}>
          <IconButton color="info" onClick={() => handleShowActivity(params.row.id)}><VisibilityOutlined /></IconButton>
        </Stack>
      )
    },
  ];

  const handleShowActivity = (activityId) => {
    const selectedActivity = draftActivities.find((activity) => activity.id === activityId);
    setActivityToShow(selectedActivity)
  }

  return (
    <>
      <Head><title>Actividades en borrador</title></Head>
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
                <Typography variant="h4">Nombre: {activityToShow.name}</Typography>
                <Typography>Id de la experiencia: {activityToShow.id}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" mb={2}>Descripción</Typography>
                <Box
                  fontSize={12}
                  dangerouslySetInnerHTML={{ __html: activityToShow.description }}
                />
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