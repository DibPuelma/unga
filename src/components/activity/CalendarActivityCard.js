import { useState } from "react";
import { Box, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { Close, DeleteOutlined, LockOpenOutlined, LockOutlined, VisibilityOutlined } from "@mui/icons-material";
import ActivityCard from "./ActivityCard";

export default function CalendarActivityCard({
  activity,
  onRemove,
  toggleLock,
}) {
  const { ref: { '@ref': { id } } } = activity;
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const handleDeleteActivity = async () => {
    onRemove(id);
  };

  return (
    <Stack
      sx={{ backgroundColor: activity.locked ? 'rgb(202, 214, 214)' : 'rgb(232, 244, 244)' }}
      borderRadius={3}
      p={1}
      position="relative"
      direction={{ xs: 'row', sm: 'column' }}
      justifyContent={{ xs: 'space-between', sm: 'center' }}
      alignItems={{ xs: 'center', sm: 'flex-start' }}
    >
      <Typography width="100%" textAlign={{ xs: 'left', sm: 'center' }} fontSize={14}>
        {activity.name}
      </Typography>
      <Stack width={{ sm: '100%' }} direction="row" alignItems="center" justifyContent={{ xs: 'flex-end', sm: 'space-between' }}>
        {toggleLock && (
          <>
            {activity.locked ? (
              <IconButton color="primary" onClick={toggleLock}>
                <LockOutlined fontSize="small" />
              </IconButton>
            ) : (
              <IconButton color="primary" onClick={toggleLock}>
                <LockOpenOutlined fontSize="small" color="disabled" />
              </IconButton>
            )}
          </>
        )}
        <IconButton color="primary" onClick={() => setActivityModalOpen(true)}>
          <VisibilityOutlined fontSize="small" />
        </IconButton>
        <IconButton color="error" onClick={handleDeleteActivity}>
          <DeleteOutlined fontSize="small" />
        </IconButton>
      </Stack>
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
    </Stack>
  )
}