import useSWR from 'swr';
import { Box, Button, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import ExpandableObjectivesList from "../objectives/ExpandableObjectivesList";
import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ascendingSort } from 'src/helpers/arrays';
import PlannedActivityObservations from './PlannedActivityObservations';
import TutorialLink from '../tutorials/TutorialLink';
import { prepareActivityForForm } from 'src/helpers/activities';
import { LoadingButton } from '@mui/lab';
import ObjectiveForActivityEvaluationSelector from '../objectives/ObjectiveForActivityEvaluationSelector';
import { SCOPES_FOR_CORE } from 'src/helpers/businessLogic';
import { UserContext } from 'src/context/UserContext';
import { isEmpty } from 'lodash';
import moment from 'moment-timezone';

const INITIAL_DATA_READY = {
  cores: false,
  objectives: false,
  subObjectives: false,
  students: false,
};

export default function PlannedActivityEvaluation({ plannedActivity, onClose, onActivityChange }) {
  const {
    id: plannedActivityId,
    activity,
    classroom, classroom: { id: classroomId },
    plannedDate,
  } = plannedActivity;
  const { institution: { id: institutionId } } = useContext(UserContext);
  const [mutableActivity, setMutableActivity] = useState(activity)
  const { name: activityName, cores: activityCores } = mutableActivity;
  const [formActivity, setFormActivity] = useState(prepareActivityForForm(activity))
  const [objectivesByCore, setObjectivesByCore] = useState({});
  const [subObjectivesByCore, setSubObjectivesByCore] = useState({});
  const [dataReady, setDataReady] = useState(INITIAL_DATA_READY);
  const [selectedTab, setSelectedTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [cores, setCores] = useState([]);
  const [selectableObjetives, setSelectableObjectives] = useState([]);
  const [selectableSubObjetives, setSelectableSubObjectives] = useState([]);
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const [updateActivityLoading, setUpdateActivityLoading] = useState(false);
  const [addingObjectives, setAddingObjectives] = useState(false)
  const addedObjectivesToActivity = useMemo(
    () => (formActivity.specificSubObjectives.length > 0 || formActivity.transversalSubObjectives.length > 0 ||
      formActivity.specificObjectives.length > 0 || formActivity.transversalObjectives.length > 0),
    [formActivity]
  )
  const endDate = useMemo(() => moment(plannedDate).endOf('day').toISOString(), [plannedDate]);

  const fetchCores = async () => {
    const coresResponse = await axios.get(`/api/institutions/${institutionId}/cores`);
    const activityCoresNames = activity.cores.map((core) => core.name);
    const activityCores = coresResponse.data.filter(
      (core) => activityCoresNames.includes(core.name)
    );
    setCores(activityCores);
    setDataReady((oldValue) => ({ ...oldValue, cores: true }));
  }

  const fetchObjectivesWithAdvancement = async (objectives) => {
    setDataReady((oldValue) => ({ ...oldValue, objectives: false }));
    const objectivesIds = objectives.filter(
      (objective) => !objective.deletedAt
    ).map((objective) => objective.id).join(',');
    if (objectivesIds.length === 0) {
      setDataReady((oldValue) => ({ ...oldValue, objectives: true }));
      return;
    }
    const objectivesResponse = await axios.get(
      `/api/classrooms/${classroomId}/objectives?ids=${objectivesIds}&endDate=${endDate}`
    );
    if (!classroom?.level?.id) {
      setDataReady((oldValue) => ({ ...oldValue, objectives: true }));
      return;
    }
    const classroomLevelId = classroom.level.id
    const objectivesFromLevel = objectivesResponse.data.filter(
      (objective) => objective.levels.find((level) => level.id === classroomLevelId)
    );
    handleObjectivesByCore(objectivesFromLevel, setObjectivesByCore);
    setDataReady((oldValue) => ({ ...oldValue, objectives: true }));
  }

  const fetchSubObjectivesWithAdvancement = async (subObjectives) => {
    setDataReady((oldValue) => ({ ...oldValue, subObjectives: false }));
    const subObjectivesIds = subObjectives.filter(
      (subObjective) => !subObjective.deletedAt
    ).map((subObjective) => subObjective.id).join(',');
    if (subObjectivesIds.length === 0) {
      setDataReady((oldValue) => ({ ...oldValue, subObjectives: true }));
      return;
    }
    const subObjectivesResponse = await axios.get(
      `/api/classrooms/${classroomId}/sub-objectives?ids=${subObjectivesIds}&endDate=${endDate}`
    );
    if (!classroom?.level?.id) {
      setDataReady((oldValue) => ({ ...oldValue, subObjectives: true }));
      return;
    }
    const classroomLevelId = classroom.level.id
    const subObjectivesFromLevel = subObjectivesResponse.data.filter(
      (subObjective) => subObjective.levels.find((level) => level.id === classroomLevelId)
    );
    handleObjectivesByCore(subObjectivesFromLevel, setSubObjectivesByCore);
    setDataReady((oldValue) => ({ ...oldValue, subObjectives: true }));
  }

  const fetchStudents = async () => {
    const studentsResponse = await axios.get(`/api/classrooms/${classroomId}/students`);
    setStudents(studentsResponse.data);
    setDataReady((oldValue) => ({ ...oldValue, students: true }));
  }

  useEffect(() => {
    !dataReady.objectives && fetchObjectivesWithAdvancement(mutableActivity.objectives);
    !dataReady.subObjectives && fetchSubObjectivesWithAdvancement(mutableActivity.subObjectives);
    !dataReady.cores && fetchCores();
    !dataReady.students && fetchStudents();
  }, [mutableActivity])

  const handleObjectivesByCore = (objectives, setStateFunction) => {
    setStateFunction((oldValue) => {
      const newObjectivesByCore = { ...oldValue };
      ascendingSort(objectives, 'name').forEach((objective) => {
        if (!newObjectivesByCore[objective.core.name]) {
          newObjectivesByCore[objective.core.name] = [];
        }
        const isAlreadyInArray = newObjectivesByCore[objective.core.name].some(
          (objectiveInArray) => objectiveInArray.id === objective.id
        );
        if (!isAlreadyInArray) newObjectivesByCore[objective.core.name].push(objective);
      })
      return newObjectivesByCore;
    });
  }

  const fetchObjectives = async () => {
    setObjectivesLoading(true);
    try {
      const objectivesResponse = await axios.get(`/api/classrooms/${classroomId}/objectives`, {
        params: {
          coresNames: activityCores.map((core) => core.name).join(','),
        },
      });
      const objectives = objectivesResponse.data || [];
      const subObjectives = objectives.map((objective) =>
        (objective.subObjectives || []).map((subObjective) => ({
          ...subObjective,
          core: objective.core,
          levels: objective.levels,
          curricularObjective: objective.curricularObjective,
        }))
      ).flat();
      setSelectableObjectives(objectives);
      setSelectableSubObjectives(subObjectives);
      setAddingObjectives(true);
    } finally {
      setObjectivesLoading(false);
    }
  }

  const handleCreateSubObjective = (subObjective, type) => {
    setSelectableSubObjectives((oldValue) => [subObjective, ...oldValue]);
    setFormActivity((oldActivity) => ({
      ...oldActivity,
      [`${type}SubObjectives`]: [...oldActivity[`${type}SubObjectives`], subObjective.id]
    }));
  }

  const handleCreateObjective = (objective, type) => {
    setSelectableObjectives((oldValue) => [objective, ...oldValue]);
    setFormActivity((oldActivity) => ({
      ...oldActivity,
      [`${type}Objectives`]: [...oldActivity[`${type}Objectives`], objective.id]
    }));
  }

  const handleMultipleSelectChange = ({ target: { name, value } }) => {
    if (value.length > 0 && value.includes(undefined)) return;
    // On autofill we get a stringified value.
    setFormActivity((oldActivity) => ({
      ...oldActivity,
      [name]: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleUpdateActivity = async () => {
    setUpdateActivityLoading(true);
    let activityId = mutableActivity.id;
    let cloneResponse = null;
    try {
      if (mutableActivity.publiclyAvailable) {
        cloneResponse = await axios.post(`/api/activities/${activityId}/clone`);
        activityId = cloneResponse.data.id;
      }
      const updateResponse = await axios.patch(`/api/institutions/${institutionId}/activities/${activityId}`, {
        ...formActivity,
        transversalObjectives: formActivity.transversalObjectives,
        specificObjectives: formActivity.specificObjectives,
        transversalSubObjectives: formActivity.transversalSubObjectives,
        specificSubObjectives: formActivity.specificSubObjectives,
      });
      await axios.patch(`/api/classrooms/${classroomId}/planned-activities/${plannedActivityId}`, {
        activityId: updateResponse.data.id,
      })
      setDataReady(INITIAL_DATA_READY);
      onActivityChange(updateResponse.data);
      setMutableActivity(updateResponse.data);
      setFormActivity(prepareActivityForForm(updateResponse.data));
      setSelectableObjectives([]);
      setSelectableSubObjectives([]);
      setAddingObjectives(false);
    } finally {
      setUpdateActivityLoading(false);
    }
  }

  const getQuantitativeEvaluationContent = () => {
    if (!dataReady.objectives || !dataReady.subObjectives) return (
      <Box minHeight="60vh" minWidth="40vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    )

    if (isEmpty(objectivesByCore) && isEmpty(subObjectivesByCore)) return (
      <Stack minHeight="60vh" minWidth="40vh" justifyContent="center" alignItems="center" rowGap={2}>
        <Typography textAlign="center">Esta experiencia no tiene indicadores para evaluar en esta sala</Typography>
        <LoadingButton variant="contained" onClick={fetchObjectives} loading={objectivesLoading}>
          Agregar indicadores
        </LoadingButton>
      </Stack>
    )

    return (
      <>
        {Object.keys(objectivesByCore).length > 0 && (
          <Stack mb={2}>
            <Typography variant="h6" gutterBottom><b>Indicadores de informe</b></Typography>
            {Object.entries(objectivesByCore).map(([coreName, objectives]) => (
              <Box mb={4} key={coreName}>
                <Typography variant="subtitle1" gutterBottom><b>{coreName}</b></Typography>
                <ExpandableObjectivesList
                  objectives={objectives}
                  evaluationDate={plannedDate}
                />
              </Box>
            ))}
          </Stack>
        )}
        {Object.keys(subObjectivesByCore).length > 0 && (
          <Stack mb={2}>
            <Typography variant="h6" gutterBottom><b>Indicadores de evaluación</b></Typography>
            {Object.entries(subObjectivesByCore).map(([coreName, subObjectives]) => (
              <Box mb={4} key={coreName}>
                <Typography variant="subtitle1" gutterBottom><b>{coreName}</b></Typography>
                <ExpandableObjectivesList
                  objectives={subObjectives}
                  evaluationDate={plannedDate}
                />
              </Box>
            ))}
          </Stack>
        )}
      </>
    )
  }

  const handleTabChange = (_, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box py={2}>
      <TutorialLink id="a18fc62e9cc24f74b60d75e771ef9283" />
      <Typography variant="h6" mt={2} mb={1} textAlign="center">
        Evaluando "{activityName}"
      </Typography>
      <Tabs value={selectedTab} onChange={handleTabChange} aria-label="Tabs de evaluación" variant="scrollable">
        <Tab label="Evaluaciones cuantitativas" />
        <Tab label="Observaciones cualitativas" />
      </Tabs>
      <Box pt={2} px={{ sm: 2 }}>
        {selectedTab === 0 && (
          addingObjectives ? (
            <>
              {cores.length > 0 && (
                <>
                  <Typography variant="h6">Núcleos de la experiencia</Typography>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    mb={2}
                    alignItems="center"
                  >
                    {cores.map((core) => (
                      <Chip
                        key={core.name}
                        sx={{ mr: 1, mt: 1 }}
                        component="span"
                        color="info"
                        size="small"
                        label={`${core.name} / ${SCOPES_FOR_CORE[core.name]}`}
                      />
                    )
                    )}
                  </Stack>
                </>
              )}
              <ObjectiveForActivityEvaluationSelector
                availableCores={cores}
                availableLevelsIds={classroom?.level?.id ? [classroom.level.id] : []}
                availableClassrooms={[classroom]}
                reportObjectives={selectableObjetives}
                subObjectives={selectableSubObjetives}
                activity={formActivity}
                handleSelectChange={handleMultipleSelectChange}
                onCreateSubObjective={handleCreateSubObjective}
                onCreateObjective={handleCreateObjective}
              />
            </>
          ) : getQuantitativeEvaluationContent()
        )}
        {selectedTab === 1 && (
          <PlannedActivityObservations
            plannedActivityId={plannedActivityId}
            classroom={classroom}
            students={students}
            cores={cores}
            plannedDate={plannedDate}
            activityName={activityName}
          />
        )}
        <Stack mt={4} direction="row" justifyContent="center" spacing={2}>
          {addingObjectives ? (
            <>
              <Button
                onClick={onClose}
                variant="outlined"
                color="error"
              >
                Cancelar
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleUpdateActivity}
                loading={updateActivityLoading}
                disabled={!addedObjectivesToActivity}
              >
                Agregar indicadores
              </LoadingButton>
            </>
          ) : (
            <Button
              onClick={onClose}
              variant="outlined"
              color="primary"
              sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}
            >
              Cerrar
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  )
}