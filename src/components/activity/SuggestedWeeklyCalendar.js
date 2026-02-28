import { ReplayOutlined } from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react"
import WeeklyActivitiesCalendar from "./WeeklyActivitiesCalendar";
import UngaCircularProgress from "../utils/UngaCircularProgress";
import UngaError from "../utils/UngaError";
import useSWRImmutable from "swr/immutable";
import { UserContext } from "src/context/UserContext";
import { LoadingButton } from "@mui/lab";
import moment from "moment-timezone";
import { MixpanelContext } from "services/MixpanelContext";
import useNoPlanWarning from "src/hooks/useNoPlanWarning";

export default function SuggestedWeeklyCalendar({ classroomId, startOfWeek, onCancel, getPlannedActivities }) {
  const { institution, userHasPlan } = useContext(UserContext);
  const { trackOpenSuggestedWeek, trackUseSuggestedWeek, trackActionInSuggestedWeek } = useContext(MixpanelContext);
  const handleOpenNoPlanWarning = useNoPlanWarning({
    title: 'No puedes agregar al calendario',
    description: 'Para poder hacerlo, debes comenzar tu prueba gratuita registrando un medio de pago',
  });
  const [updateLoading, setUpdateLoading] = useState(true);
  const [activitiesByDay, setActivitiesByDay] = useState({});
  const [planLoading, setPlanLoading] = useState(false);

  const lockedActivitiesIdsByDay = useMemo(() =>
    Object.entries(activitiesByDay).reduce((acc, [day, activities]) => {
      acc[day] = activities.filter((activity) => activity.locked).map((activity) => activity.id);
      return acc;
    }, {}),
    [activitiesByDay]
  );

  function fetchData() {
    return axios.get(
      `/api/classrooms/${classroomId}/suggested-weekly-calendar?referenceDate=${startOfWeek}`,
      {
        params: {
          lockedActivitiesIdsByDay
        }
      }
    )
  }

  const { data: response, error, mutate: refetch } = useSWRImmutable(
    `/api/classrooms/${classroomId}/suggested-weekly-calendar?referenceDate=${startOfWeek}`,
    fetchData,
  );

  useEffect(() => {
    if (response) {
      const newActivitiesByDay = response.data;
      Object.entries(lockedActivitiesIdsByDay).forEach(([day, lockedActivitiesIds]) => {
        newActivitiesByDay[day] = newActivitiesByDay[day].map((activity) => {
          if (lockedActivitiesIds.includes(activity.id)) {
            return { ...activity, locked: true };
          }
          return activity;
        });
      });
      setActivitiesByDay(newActivitiesByDay);
      setUpdateLoading(false);
    }
  }, [response])

  useEffect(() => {
    // trackOpenSuggestedWeek(startOfWeek);
  }, [startOfWeek]);

  const handleRefetch = () => {
    setUpdateLoading(true);
    refetch();
  }

  const onDragEnd = (result) => {
    // trackActionInSuggestedWeek(startOfWeek, 'drag');
    const newActivitiesByDay = { ...activitiesByDay };
    const {
      source: { droppableId: oldDay, index: oldIndex },
      destination: { droppableId: newDay, index: newIndex },
    } = result;
    if (oldDay === newDay && oldIndex === newIndex) return;
    let indexToDelete = oldIndex;
    if (oldDay === newDay) {
      const indexToReplace = newIndex > oldIndex ? newIndex + 1 : newIndex;
      newActivitiesByDay[newDay].splice(indexToReplace, 0, newActivitiesByDay[oldDay][oldIndex]);
      indexToDelete = newIndex > oldIndex ? oldIndex : oldIndex + 1;
      newActivitiesByDay[newDay].splice(indexToDelete, 1);
    } else {
      newActivitiesByDay[newDay].splice(newIndex, 0, newActivitiesByDay[oldDay][oldIndex]);
      newActivitiesByDay[oldDay].splice(indexToDelete, 1);
    }
    setActivitiesByDay(newActivitiesByDay);
  }

  const handlePlanCalendar = async () => {
    if (!userHasPlan) {
      handleOpenNoPlanWarning();
      return;
    }
    // trackUseSuggestedWeek(startOfWeek);
    setPlanLoading(true);
    const promises = [];
    Object.entries(activitiesByDay).forEach(([day, activities]) => {
      const date = moment(startOfWeek).add(day - 1, 'days').format('YYYY-MM-DD');
      activities.forEach((activity) => {
        promises.push(
          axios.post(`/api/institutions/${institution.id}/activities/${activity.id}/plan`, {
            classroom: classroomId,
            date,
          })
        )
      })
    })
    try {
      await Promise.all(promises);
      getPlannedActivities();
      onCancel();
    } finally {
      setPlanLoading(false);
    }
  }

  const handleRemove = (day, id) => {
    // trackActionInSuggestedWeek(startOfWeek, 'remove')
    const newActivitiesByDay = { ...activitiesByDay };
    newActivitiesByDay[day] = newActivitiesByDay[day].filter((activity) => activity.id !== id);
    setActivitiesByDay(newActivitiesByDay);
  }

  const handleLockActivity = (day, id) => {
    const newActivitiesByDay = { ...activitiesByDay };
    newActivitiesByDay[day] = newActivitiesByDay[day].map((activity) => {
      if (activity.id === id) {
        // trackActionInSuggestedWeek(startOfWeek, activity.locked ? 'unlock' : 'lock')
        return { ...activity, locked: !activity.locked };
      }
      return activity;
    });
    setActivitiesByDay(newActivitiesByDay);
  }

  if (error && !updateLoading) {
    return (
      <Stack>
        <UngaError text="Hubo un error al intentar sugerir experiencias" />
        <Button onClick={handleRefetch} variant="outlined">Reintentar</Button>
      </Stack>
    )
  }

  return (
    <Stack mt={6} pb={6}>
      <Typography gutterBottom variant="h6" lineHeight={1.3} ml={{ xs: 0, sm: 1 }} color="textSecondary">
        Experiencias sugeridas para realizar esta semana
      </Typography>
      <Typography ml={{ xs: 0, sm: 1 }} variant="body2" color="textSecondary">
        Puedes usar el candado en cada experiencia para dejarlas fijas y que no se cambien al sugerir otra vez.
      </Typography>
      <Stack mt={4}>
        {updateLoading ? <UngaCircularProgress /> : (
          <WeeklyActivitiesCalendar
            classroomId={classroomId}
            startOfWeek={startOfWeek}
            activitiesByDay={activitiesByDay}
            onRemove={handleRemove}
            toggleLockActivity={handleLockActivity}
            onDragEnd={onDragEnd}
            emptyDayMesage="No tenemos experiencias para sugerirte este día"
          />
        )}
        <Stack mt={{ xs: 4, sm: 0 }} px={1} rowGap={2} alignItems={{ sm: 'center' }}>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              color="error"
              variant="outlined"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              startIcon={<ReplayOutlined />}
              variant="outlined"
              disabled={updateLoading}
              onClick={handleRefetch}
              color="info"
            >
              Sugerir otra vez
            </Button>
          </Stack>
          <LoadingButton
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            variant="contained"
            color="primary"
            disabled={updateLoading}
            loading={planLoading}
            onClick={handlePlanCalendar}
          >
            Agregar al calendario
          </LoadingButton>
        </Stack>
      </Stack>
    </Stack>
  )
}