import { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar, Stack, Typography } from "@mui/material";
import { Close, DeleteOutlined, EditOutlined, Grading, MoreVertOutlined, PrintOutlined, Reviews, ReviewsOutlined, VisibilityOutlined } from "@mui/icons-material";
import { DialogContext } from "src/context/DialogContext";
import ActivityCard from "./ActivityCard";
import PlannedActivityEvaluation from './PlannedActivityEvaluation';
import axios from "axios";
import UngaFullScreenDialog from "../utils/UngaFullScreenDialog";
import { PlanningContext } from "src/context/PlanningContext";
import { getCoresByScope } from "src/helpers/businessLogic";
import ActivityReview from "./ActivityReview";
import { useRouter } from "next/router";
import { EditNotificationsOutlined } from "@mui/icons-material";
import { UserContext } from "src/context/UserContext";
import Link from "src/Link";

export default function PlannedActivityCard({
  printable,
  plannedActivity: propsPlannedActivity,
  isInThePastOrNow,
  onSelect,
  selected,
  position,
}) {
  const router = useRouter();
  const [plannedActivity, setPlannedActivity] = useState(propsPlannedActivity);
  const {
    id,
    activity,
    activity: {
      id: activityId,
      publiclyAvailable,
      openToCommunity,
      creator: { id: creatorId },
      sponsorInstitution,
    },
    plannedDate,
    classroom: { id: classroomId },
  } = plannedActivity;
  const { setOpen, setTitle, handleOnConfirmChange, setDescription } = useContext(DialogContext);
  const { setPlannedActivityToEvaluate } = useContext(PlanningContext);
  const { institution: { id: institutionId }, user } = useContext(UserContext);
  const [deleteStatus, setDeleteStatus] = useState({
    loading: false,
    error: false,
    success: false,
  })
  const [activityToReview, setActivityToReview] = useState(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [checked, setChecked] = useState(selected);
  const [anchorEl, setAnchorEl] = useState(null);

  const canManage = useMemo(() => (
    sponsorInstitution?.id === institutionId
    && (user.role === 'principal' || user.role === 'coordinator' || creatorId === user.id)
  ), [user, institutionId, sponsorInstitution, publiclyAvailable, openToCommunity]);
  const returnUrl = useMemo(() => `${router.asPath.split('?')[0]}?startDate=${plannedDate}`);

  useEffect(() => { setChecked(selected) }, [selected]);

  const handleCheck = ({ target: { checked } }) => {
    setChecked(checked);
    onSelect({ id, activity: activity.id, date: plannedDate });
  }

  const cleanDeleteStatus = () => {
    setDeleteStatus({
      loading: false,
      error: false,
      success: false,
    });
  };

  const handleConfirmDelete = () => {
    setOpen(true);
    setTitle('¿Quieres sacar esta experiencia de tu planificación?');
    setDescription('');
    handleOnConfirmChange(() => handleDeleteActivity(id));
  };

  const handleDeleteActivity = async (id) => {
    setDeleteStatus({ loading: true });
    try {
      await axios.delete(`/api/classrooms/${classroomId}/planned-activities/${id}`)
      setDeleteStatus({ success: true });
    } catch (error) {
      console.error(error);
      setDeleteStatus({ error: true });
    } finally {
      setDeleteStatus((oldValue) => ({ ...oldValue, loading: false }))
    }
  };

  const handleConfirmEditOnlyDate = () => {
    setOpen(true);
    setTitle('¿Quieres editar esta experiencia solo para este día?');
    setDescription('Se generará una copia y solo se modificará la experiencia para el día que has seleccionado, no afectará a las demás fechas en las que tengas esta experiencia planificada.')
    handleOnConfirmChange(handleEditActivityOnlyDate);
  };

  const handleConfirmEditActivity = () => {
    setOpen(true);
    setTitle('¿Quieres editar la experiencia original?');
    setDescription('Esto generará cambios en todos los días que la experiencia esté planificada.')
    handleOnConfirmChange(handleEditActivity);
  };

  const handleEditActivityOnlyDate = async () => {
    let response = null;
    if (publiclyAvailable) response = await axios.post(`/api/activities/${activityId}/clone`);
    else response = await axios.post(`/api/institutions/${institutionId}/activities/${activityId}/clone`);

    await axios.delete(`/api/classrooms/${classroomId}/planned-activities/${id}`)
    await axios.post(`/api/institutions/${institutionId}/activities/${response.data.id}/plan`, {
      classroom: classroomId,
      date: plannedDate,
      position,
    });
    router.push(`/institutions/${institutionId}/activities/${response.data.id}/edit?returnUrl=${returnUrl}`);
  }

  const handleEditActivity = async () => {
    router.push(`/institutions/${institutionId}/activities/${activityId}/edit?returnUrl=${returnUrl}`);
  }

  const handleCloseEvaluationModal = () => {
    setPlannedActivityToEvaluate(null);
    setEvaluationModalOpen(false)
  }

  const handleOpenEvaluationModal = () => {
    setPlannedActivityToEvaluate(plannedActivity);
    setEvaluationModalOpen(true)
  }

  const handleOpenReviewModal = () => {
    setActivityToReview(plannedActivity.activity);
    setReviewModalOpen(true)
  }

  const handleCloseReviewModal = () => {
    setActivityToReview(null);
    setReviewModalOpen(false)
  }

  const handleActionsOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActionsClose = () => {
    setAnchorEl(null);
  };

  const handleActivityChange = (activity) => {
    setPlannedActivity((oldValue) => ({
      ...oldValue,
      activity,
    }));
  };

  if (deleteStatus.success) return null;

  const printableTableUrl = `/classes/${classroomId}/lesson-plan/printable-table`;

  return (
    <Stack
      sx={{ backgroundColor: !printable && 'rgb(232, 244, 244)' }}
      borderRadius={3}
      p={1}
      position="relative"
      direction={{ xs: 'row', sm: 'column' }}
      justifyContent={{ xs: 'space-between', sm: 'center' }}
    >
      {printable && (
        <>
          {Object.entries(getCoresByScope(activity.cores)).filter(([_, cores]) => cores.length > 0).map(([scope, cores]) => (
            <Typography fontSize={8} align="center" lineHeight={1.2}>
              <b>{scope}</b> {cores.map((core) => core.name).join(', ')}
            </Typography>
          ))}
        </>
      )}
      <Stack direction="row" alignItems="center">
        {onSelect && (
          <Checkbox
            checked={checked}
            onChange={handleCheck}
            inputProps={{ 'aria-label': 'Select planned activity' }}
          />
        )}
        <Typography sx={{ width: '100%' }} textAlign="center" fontSize={printable ? 10 : 14}>
          {printable && position && `${position}.`} {activity.name}
        </Typography>
      </Stack>
      {!printable && (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton color="primary" onClick={() => setActivityModalOpen(true)}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
          {isInThePastOrNow && (
            <IconButton color="info" onClick={handleOpenEvaluationModal}>
              <Grading fontSize="small" />
            </IconButton>
          )}
          <>
            <IconButton onClick={handleActionsOpen}>
              <MoreVertOutlined fontSize="small" />
            </IconButton>
            <Menu
              sx={{ mt: 1 }}
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleActionsClose}
            >
              <MenuItem onClick={handleConfirmEditOnlyDate}>
                <ListItemIcon>
                  <EditNotificationsOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar solo para este día</ListItemText>
              </MenuItem>
              {canManage && (
                <MenuItem onClick={handleConfirmEditActivity}>
                  <ListItemIcon>
                    <EditOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Editar experiencia original</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleOpenReviewModal}>
                <ListItemIcon>
                  <ReviewsOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Escribir reseña</ListItemText>
              </MenuItem>
              <Link noLinkStyle href={`${printableTableUrl}?plannedActivityId=${id}&startDate=${plannedDate}&endDate=${plannedDate}`}>
                <MenuItem>
                  <ListItemIcon>
                    <PrintOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Imprimir</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem onClick={handleConfirmDelete}>
                <ListItemIcon>
                  <DeleteOutlined color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText><Typography color="error">Quitar</Typography></ListItemText>
              </MenuItem>
            </Menu>
          </>
        </Stack>
      )}
      {deleteStatus.loading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          borderRadius={3}
          sx={{ backgroundColor: 'rgb(232, 244, 244)' }}
        >
          <CircularProgress sx={{ position: 'absolute', top: '30%', left: '35%' }} />
        </Box>
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={Boolean(deleteStatus.error)}
        onClose={cleanDeleteStatus}
        autoHideDuration={5000}
      >
        <Alert onClose={cleanDeleteStatus} severity="error" sx={{ width: '100%' }}>
          No pudimos borrar la actividad de la planificación
        </Alert>
      </Snackbar>
      <Dialog
        maxWidth="xl"
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
      >
        <Box minWidth={window.innerWidth * 0.8} p={4} position="relative">
          <ActivityCard activity={activity} />
          <IconButton
            onClick={() => setActivityModalOpen(false)}
            sx={{ position: 'absolute', right: 5, top: 5 }}
          >
            <Close color="error" />
          </IconButton>
        </Box>
      </Dialog>
      <Dialog
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      >
        <Box p={4} pt={6} position="relative">
          <ActivityReview
            activity={activityToReview}
            onClose={() => setReviewModalOpen(false)}
          />
          <IconButton
            onClick={() => setReviewModalOpen(false)}
            sx={{ position: 'absolute', right: 5, top: 5 }}
          >
            <Close color="error" />
          </IconButton>
        </Box>
      </Dialog>
      <UngaFullScreenDialog
        open={evaluationModalOpen}
        onClose={handleCloseEvaluationModal}
      >
        <PlannedActivityEvaluation
          onClose={handleCloseEvaluationModal}
          plannedActivity={plannedActivity}
          onActivityChange={handleActivityChange}
        />
      </UngaFullScreenDialog>
    </Stack>
  )
}