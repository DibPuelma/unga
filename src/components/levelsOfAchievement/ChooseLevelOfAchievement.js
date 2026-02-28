import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Grid, LinearProgress, MenuItem, Radio, RadioGroup, Snackbar, TextField, Tooltip, useMediaQuery } from '@mui/material';
import axios from 'axios';
import { useSession } from 'next-auth/react';

import { UserContext } from '../../context/UserContext';
import { MixpanelContext } from '../../../services/MixpanelContext';
import { useRouter } from 'next/router';
import { PlanningContext } from 'src/context/PlanningContext';
import { toAcronym } from 'src/helpers/strings';
import useNoPlanWarning from 'src/hooks/useNoPlanWarning';

export default function ChooseLevelOfAchievement({
  currentValue,
  student,
  objective,
  objective: { id: objectiveId },
  onChange,
  type = 'radio',
  size = 'medium',
  evaluationDate = null,
  disabled,
  advancement,
}) {
  const router = useRouter();
  const { query: { classroomId } } = router;
  const { data: { user: { institution, classrooms } } } = useSession();
  const { levelsOfAchievement, selectedClassroom, userHasPlan } = useContext(UserContext);
  const { plannedActivityToEvaluate } = useContext(PlanningContext);
  const {
    trackCreateEvaluation,
    trackCreatePlannedActivityEvaluation,
    trackCreateSubObjectiveEvaluation,
  } = useContext(MixpanelContext);
  const handleOpenNoPlanWarning = useNoPlanWarning({
    title: 'Inicia tu prueba gratuita para poder evaluar',
    description: 'Para poder evaluar, debes comenzar tu prueba gratuita registrando un medio de pago',
  })
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const notObserved = levelsOfAchievement.find(
    (levelOfAchievement) => levelOfAchievement.value === 0
  );
  const [
    selectedLevelOfAchievement,
    setSelectedLevelOfAchievement,
  ] = useState(currentValue || notObserved.id);
  const [error, setError] = useState(false);

  useEffect(() => setSelectedLevelOfAchievement(currentValue), [currentValue])

  const isSubObjective = useMemo(() => !!objective.objective, [objective]);

  const sendEvaluation = async (body, trackingData) => {
    await axios.post('/api/evaluations', { ...body, objectiveId: objectiveId });
    // trackCreateEvaluation({ ...trackingData, objectiveName: objective.name });
  }

  const sendPlannedActivityEvaluation = async (body, trackingData) => {
    const fullBody = {
      ...body,
      activityId: plannedActivityToEvaluate.activity.id,
      activityPlannedDate: plannedActivityToEvaluate.plannedDate,
    }
    const fullTrackingData = {
      ...trackingData,
      activityPlannedDate: plannedActivityToEvaluate.plannedDate,
      activityName: plannedActivityToEvaluate.activity.name,
      activityId: plannedActivityToEvaluate.activity.id,
    }

    if (isSubObjective) {
      fullTrackingData.subObjectiveName = objective.name;
      fullBody.subObjectiveId = objectiveId;
      fullBody.objectiveId = objective.objective.id;
    } else {
      fullTrackingData.objectiveName = objective.name;
      fullBody.objectiveId = objectiveId;
    }

    await axios.post(`/api/classrooms/${classroomId}/planned-activities/${plannedActivityToEvaluate.id}/evaluations`,
      fullBody
    )
    // trackCreatePlannedActivityEvaluation(fullTrackingData)
  }

  const sendSubObjectiveEvaluation = async (body, trackingData) => {
    const fullBody = {
      ...body,
      subObjectiveId: objectiveId,
    }
    delete fullBody.objectiveId
    await axios.post(`/api/sub-objectives-evaluations`, fullBody);
    // trackCreateSubObjectiveEvaluation({ ...trackingData, subObjectiveName: objective.name });
  };

  const handleLevelOfAchievementChange = async ({ target: { value } }) => {
    if (!userHasPlan) {
      handleOpenNoPlanWarning();
      return;
    }
    setError(false);
    const oldValue = selectedLevelOfAchievement;
    setSelectedLevelOfAchievement(value);
    const levelOfAchievement = levelsOfAchievement.find((loa) => loa.id === value)
    const oldLevelOfAchievement = levelsOfAchievement.find((loa) => loa.id === oldValue)
    const studentId = student.id;
    const baseBody = {
      studentId,
      institutionId: institution.id,
      oldLevelOfAchievementId: oldValue,
      levelOfAchievementId: value,
    }
    const baseTrackingData = {
      classroomName: selectedClassroom.name,
      coreName: objective.core?.name || '',
      oldLevelOfAchievementName: oldLevelOfAchievement?.name || '',
      oldLevelOfAchievementValue: oldLevelOfAchievement?.value ?? 0,
      levelOfAchievementName: levelOfAchievement?.name || '',
      levelOfAchievementValue: levelOfAchievement?.value ?? 0,
      studentName: `${student.firstName} ${student.lastName}`,
    }
    const evaluationBody = {
      ...baseBody,
      classroomId,
      date: evaluationDate || null,
    }

    try {
      if (isSubObjective) {
        await sendSubObjectiveEvaluation(evaluationBody, baseTrackingData)
      } else {
        await sendEvaluation(evaluationBody, baseTrackingData)
      }
      if (onChange) {
        onChange({
          studentId,
          levelOfAchievement,
          objectiveId,
        });
      }
      if (plannedActivityToEvaluate) {
        sendPlannedActivityEvaluation(baseBody, baseTrackingData)
      }
    } catch (error) {
      console.error(error);
      setSelectedLevelOfAchievement(oldValue);
      setError(true);
    }
  };

  const handleSnackbarClose = () => setError(false);

  return (
    <>
      {type === 'radio' ? (
        <RadioGroup
          aria-labelledby="demo-controlled-radio-buttons-group"
          name="controlled-radio-buttons-group"
          value={selectedLevelOfAchievement}
          onChange={handleLevelOfAchievementChange}
        >
          <Grid container columns={levelsOfAchievement.length} direction="row" position="relative">
            {levelsOfAchievement.map((level) => (
              <Grid item xs={1} display="flex" justifyContent="center" key={level.id}>
                <Radio
                  value={level.id}
                  size={size}
                  disabled={!classrooms?.includes(classroomId) || disabled}
                  classes={{
                    root: {
                      padding: '0 !important',
                    },

                  }}
                  sx={{ zIndex: 100, backgroundColor: 'white', px: advancement >= 0 ? 0 : '9px' }}
                />
              </Grid>
            ))}
            {advancement >= 0 && (
              <Grid item xs={levelsOfAchievement.length} position="absolute" top="47%" width="80%" left="10%">
                <LinearProgress variant="determinate" value={advancement || 0} />
              </Grid>
            )}
          </Grid>
        </RadioGroup>
      ) : (
        <TextField
          select
          variant="outlined"
          value={selectedLevelOfAchievement}
          onChange={handleLevelOfAchievementChange}
          size={size}
          fullWidth
          disabled={disabled}
        >
          {levelsOfAchievement.map((levelOfAchievement) => (
            <MenuItem key={levelOfAchievement.id} value={levelOfAchievement.id}>
              {mdUp ? levelOfAchievement.name : toAcronym(levelOfAchievement.name)}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={error}
        onClose={handleSnackbarClose}
        autoHideDuration={5000}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          No se pudo registrar la evaluación
        </Alert>
      </Snackbar>
    </>
  )
}