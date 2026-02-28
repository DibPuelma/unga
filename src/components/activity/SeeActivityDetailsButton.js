import { Close, VisibilityOutlined } from "@mui/icons-material"
import { Box, Button, Dialog, IconButton, Typography, useMediaQuery } from "@mui/material"
import ActivityCard from "./ActivityCard"
import { useContext, useEffect, useState } from "react";
import { UserContext } from "src/context/UserContext";
import axios from "axios";
import useNoPlanWarning from "src/hooks/useNoPlanWarning";
import ActivityCardForParents from "./ActivityCardForParents";
import { MixpanelContext } from "services/MixpanelContext";

export default function SeeActivityDetailsButton({ activity, forParents, onShow, onClose, forceModalOpen = false }) {
  const { user, userHasPlan, setUser } = useContext(UserContext);
  const { trackViewActivity } = useContext(MixpanelContext);
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const handleNoPlanWarning = useNoPlanWarning({
    title: '¡Ya viste 10 experiencias!',
    description: 'Para poder ver más, debes comenzar tu prueba gratuita registrando un medio de pago',
  })
  const [activityModalOpen, setActivityModalOpen] = useState(forceModalOpen);

  useEffect(() => {
    if (activityModalOpen) setActivityModalOpen(Boolean(forceModalOpen));
  }, [forceModalOpen])

  const handleOpenModal = async () => {
    if (!activity.publiclyAvailable) {
      // trackViewActivity({ name: activity.name, isPublic: false, isFromCommunity: !!activity.openToCommunity  });
      onShow && onShow();
      setActivityModalOpen(true);
      return;
    }
    if (user.seenActivities && user.seenActivities.length >= 10 && !user.seenActivities.includes(activity.id)) {
      handleNoPlanWarning();
    } else {
      if (!userHasPlan) {
        axios.patch(`/api/users/${user.id}`, { sawActivity: activity.id })
          .then(response => {
            setUser({ ...response.data, id: response.data.id });
          })
      }
      // trackViewActivity({ name: activity.name, isPublic: true, isFromCommunity: !!activity.openToCommunity });
      onShow && onShow();
      setActivityModalOpen(true);
    }
  }

  const handleClose = () => {
    onClose && onClose();
    setActivityModalOpen(false);
  }

  return (
    <>
      {/* <IconButton
        onClick={handleOpenModal}
        color="primary"
        sx={{ display: { xs: 'inline-flex', md: 'none' } }}
      >
        <VisibilityOutlined />
      </IconButton> */}
      <Button
        onClick={handleOpenModal}
        startIcon={<VisibilityOutlined />}
        color="primary"
        variant="contained"
      >
        Ver
      </Button>
      <Dialog
        fullScreen={!smUp}
        maxWidth="lg"
        open={activityModalOpen}
        onClose={handleClose}
      >
        <Box p={4} pb={8} position="relative">
          {!userHasPlan && activity.publiclyAvailable && user.seenActivities && (
            <Typography variant="body2" sx={(theme) => ({ mb: 2, color: theme.palette.warning.main })}>
              Puedes ver {10 - user.seenActivities.length} actividades más antes de tener que seleccionar un plan
            </Typography>
          )}
          {forParents ? (
            <ActivityCardForParents activity={activity} />
          ) : (
            <ActivityCard activity={activity} />
          )}
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 5, top: 5 }}
          >
            <Close color="error" />
          </IconButton>
          {forParents && (
            <Button
              fullWidth
              color="error"
              variant="contained"
              sx={{ position: 'fixed', bottom: 0, left: 0, borderRadius: 0, display: { sm: 'none'} }}
              onClick={handleClose}
            >
              Cerrar
            </Button>
          )}
        </Box>
      </Dialog>
    </>
  )
}