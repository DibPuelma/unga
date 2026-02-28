import { useState } from "react";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from "@mui/material";
import { capitalize } from "lodash";

export default function ManagePlannedActivitiesButton({ plannedActivitiesPerDay, onChange, color }) {
  const [hiddenActivities, setHiddenActivities] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  const handleCheckActivity = ({ target: { checked } }, plannedActivityId, day) => {
    const newPlannedActivitiesPerDay = { ...plannedActivitiesPerDay };
    const index = plannedActivitiesPerDay[day].findIndex((plannedActivity) => plannedActivity.id === plannedActivityId)
    plannedActivitiesPerDay[day][index] = {
      ...plannedActivitiesPerDay[day][index],
      hide: !checked,
    };

    setHiddenActivities((oldValue) => ({
      ...oldValue,
      [plannedActivityId]: !checked,
    }))
    onChange(newPlannedActivitiesPerDay);
  }

  const handleOpenModal = () => {
    setModalOpen(true);
  }

  return (
    <>
      <Button
        variant="contained"
        color={color}
        onClick={handleOpenModal}
      >
        Agregar o quitar experiencias
      </Button>
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <DialogTitle>Experiencias seleccionadas</DialogTitle>
        <DialogContent>
          <Stack rowGap={3}>
            {Object.entries(plannedActivitiesPerDay).map(([day, plannedActivities]) => (
              <Stack key={day}>
                <Typography variant="h6">{capitalize(day)}</Typography>
                {plannedActivities.map((plannedActivity) => (
                  <FormControlLabel
                    key={plannedActivity.id}
                    control={
                      <Checkbox
                        checked={!hiddenActivities[plannedActivity.id]}
                        onChange={(e) => handleCheckActivity(e, plannedActivity.id, day)}
                      />
                    }
                    label={plannedActivity.activity.name}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}