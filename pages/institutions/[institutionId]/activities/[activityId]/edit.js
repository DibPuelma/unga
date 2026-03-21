import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Dialog,
  Grid,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import MaterialsInput from 'src/components/activity/MaterialsInput';
import { isAuthorized } from 'services/Authorization';
import { getNonHeterogeneousLevels, getNonTemporalLevels } from 'db/level';
import { getInstitutionCoresWithObjectives } from 'db/core';
import CloudinaryUploadWidget from 'src/components/utils/CloudinaryUploadWidget';
import { LoadingButton } from '@mui/lab';
import { AutoFixHigh, LockOutlined, SaveOutlined, Upload } from '@mui/icons-material';
import axios from 'axios';
import UngaSelect from 'src/components/utils/UngaSelect';
import { UserContext } from 'src/context/UserContext';
import { MixpanelContext } from 'services/MixpanelContext';
import Head from 'next/head';
import { getSubObjectivesForInstitution } from 'db/subObjectives';
import { getInstitutionWithConfiguration, getInstitutionWithStructure } from 'db/institution';
import { ascendingSort } from 'src/helpers/arrays';
import { openAiResponseToHTML } from 'src/helpers/strings';
import UngaSelectObjectives from 'src/components/utils/UngaSelectObjectives';
import { getEditAccessClassrooms } from 'src/helpers/businessLogic';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import { difference } from 'lodash';
import ObjectiveForActivityEvaluationSelector from 'src/components/objectives/ObjectiveForActivityEvaluationSelector';
import { prepareActivityForForm } from 'src/helpers/activities';
import { idMapper } from 'src/helpers/parsers';
import { getActivity } from 'db/activity';
import { getActivityThemes } from 'db/activitiesThemes';
import { getConsequentialCurricularObjectives } from 'db/consequentialCurricularObjectives';
import AddNewConsequentialCurricularObjective from 'src/components/consequentialCurricularObjectives/NewForm';
import usePlans from 'src/hooks/usePlans';
import usePlanUpgradeWarning from 'src/hooks/usePlanUpgradeWarning';
import { serializeForNextProps } from 'src/helpers/businessLogic';

const Editor = dynamic(import('src/components/utils/Quill/Editor'), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

const IDEA_ORIGIN_OPTIONS = [
  'Interés de los niños/as',
  'Selección priorización',
  'Celebración cultural',
];

const AUTOSAVE_INTERVAL_IN_SECONDS = 5;
const TIMER_INTERVAL = 1000;

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);
  const { user: { institution: { id: institutionId } } } = session;
  const { query: { activityId } } = context;

  const cores = await getInstitutionCoresWithObjectives(institutionId);
  const subObjectives = await getSubObjectivesForInstitution(institutionId);
  const institutionWithStructure = await getInstitutionWithStructure(institutionId);
  const institutionWithConfigs = await getInstitutionWithConfiguration(institutionId);
  const classrooms = institutionWithStructure.classrooms;
  const levels = await getNonHeterogeneousLevels();
  const allowedClassrooms = getEditAccessClassrooms(session.user, classrooms);
  const allowedClassroomsIds = allowedClassrooms.map((classroom) => classroom.id);
  
  // Get all objectives for allowed classrooms
  const reportObjectives = cores.reduce(
    (acc, core) => acc.concat(core.objectives), []
  ).filter(
    (objective) => objective.classrooms.reduce(
      (acc, classroom) => acc || allowedClassroomsIds.includes(classroom.id), false
    )
  );
  
  const reportObjectivesIds = reportObjectives.map((objective) => objective.id);
  const allowedSubObjectives = subObjectives.filter(
    (subObjective) => reportObjectivesIds.includes(subObjective.objective?.id)
  ).map((subObjective) => {
    const { objective, ...rest } = subObjective;
    return rest;
  });
  
  const activity = await getActivity(activityId);
  const themes = await getActivityThemes();
  const consequentialCurricularObjectives = await getConsequentialCurricularObjectives(institutionId);

  return {
    props: serializeForNextProps({
      institutionId,
      themes,
      cores,
      levels,
      consequentialCurricularObjectives,
      activity,
      subObjectives: allowedSubObjectives,
      classrooms: allowedClassrooms,
      activitiesConfig: institutionWithConfigs?.configuration?.activities || null,
    })
  }
}

export default function EditActivity({
  institutionId,
  themes,
  cores,
  levels,
  consequentialCurricularObjectives,
  subObjectives: propsSubObjectives,
  classrooms,
  activity: propsActivity
}) {
  const router = useRouter();
  const { institution: { features }, user: { plan } } = useContext(UserContext);
  const {
    trackEditActivityPageView,
    trackCreateSuggestedActivity,
    trackRequestSuggestActivity,
    trackWaitedForSuggestedActivity,
  } = useContext(MixpanelContext);
  
  const activityToEditPreparedForForm = useMemo(() => {
    const prepared = prepareActivityForForm(propsActivity);
    // Ensure all arrays are initialized (defensive check)
    if (prepared) {
      prepared.recommendedLevels = prepared.recommendedLevels || [];
      prepared.transversalCores = prepared.transversalCores || [];
      prepared.specificCores = prepared.specificCores || [];
      prepared.transversalCurricularObjectives = prepared.transversalCurricularObjectives || [];
      prepared.specificCurricularObjectives = prepared.specificCurricularObjectives || [];
      prepared.transversalObjectives = prepared.transversalObjectives || [];
      prepared.specificObjectives = prepared.specificObjectives || [];
      prepared.transversalSubObjectives = prepared.transversalSubObjectives || [];
      prepared.specificSubObjectives = prepared.specificSubObjectives || [];
      prepared.consequentialCurricularObjectives = prepared.consequentialCurricularObjectives || [];
    }
    return prepared;
  }, [propsActivity]);
  const [activity, setActivity] = useState(activityToEditPreparedForForm);
  const [actionResponse, setActionResponse] = useState({
    loading: false,
    error: false,
    success: false,
  });
  const [dynamicConsequentialCurricularObjectives, setDynamicConsequentialCurricularObjectives] = useState(consequentialCurricularObjectives);
  const [subObjectives, setSubObjectives] = useState(propsSubObjectives);
  const [reportObjectives, setReportObjectives] = useState([]);
  const [suggestExperienceLoading, setSuggestExperienceLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [secondsSinceLastSave, setSecondsSinceLastSave] = useState(0);
  const [addNewConsequentialCurricularObjective, setAddNewConsequentialCurricularObjective] = useState(false);
  const assetsComponentRef = useRef();
  
  const transversalCores = ascendingSort(cores.filter((core) => core.type === 'transversal'), 'position');
  const specificCores = ascendingSort(cores.filter((core) => core.type === 'specific'), 'position');

  // Initialize report objectives from cores
  useEffect(() => {
    const allowedClassroomsIds = classrooms.map((classroom) => classroom.id);
    const reportObjectives = cores.reduce(
      (acc, core) => acc.concat(core.objectives), []
    ).filter(
      (objective) => objective.classrooms.reduce(
        (acc, classroom) => acc || allowedClassroomsIds.includes(classroom.id), false
      )
    );
    setReportObjectives(reportObjectives);
  }, [cores, classrooms]);

  useEffect(() => {
    // trackEditActivityPageView()
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceLastSave((oldValue) => {
        const newValue = oldValue + (TIMER_INTERVAL / 1000);
        if (AUTOSAVE_INTERVAL_IN_SECONDS === newValue) {
          return 0;
        }
        return newValue;
      })
    }, TIMER_INTERVAL);
    return () => clearInterval(interval);
  }, [TIMER_INTERVAL]);

  useEffect(() => {
    if (secondsSinceLastSave === 0) {
      handleSave({ autoSave: true });
    }
  }, [secondsSinceLastSave]);

  // ========== FILTERING LOGIC ==========
  
  // Get selected cores (transversal + specific)
  const selectedCores = useMemo(() => {
    return cores.filter((core) => 
      [...activity.transversalCores, ...activity.specificCores].includes(core.id)
    );
  }, [activity.transversalCores, activity.specificCores, cores]);

  // Get selected levels
  const selectedLevels = useMemo(() => {
    return levels.filter((level) => activity.recommendedLevels.includes(level.id));
  }, [activity.recommendedLevels, levels]);

  // Filter 1: Core + Level → CurricularObjectives
  // Show only CurricularObjectives that belong to selected cores and selected levels
  const availableCurricularObjectives = useMemo(() => {
    if (selectedCores.length === 0 || selectedLevels.length === 0) {
      return [];
    }

    const selectedCoreIds = selectedCores.map(c => c.id);
    const selectedLevelIds = selectedLevels.map(l => l.id);

    const curricularObjectives = [];
    
    selectedCores.forEach((core) => {
      if (core.curricularObjectives) {
        core.curricularObjectives.forEach((co) => {
          // Check if this curricular objective has any of the selected levels
          const hasSelectedLevel = co.levels && co.levels.some((level) => 
            selectedLevelIds.includes(level.id)
          );
          
          if (hasSelectedLevel) {
            // Avoid duplicates
            if (!curricularObjectives.find(c => c.id === co.id)) {
              curricularObjectives.push({
                ...co,
                core: core,
              });
            }
          }
        });
      }
    });

    return curricularObjectives;
  }, [selectedCores, selectedLevels]);

  // Split curricular objectives by type
  const transversalCurricularObjectives = useMemo(() => {
    return availableCurricularObjectives.filter((co) => 
      co.core.type === 'transversal' && 
      activity.transversalCores.includes(co.core.id)
    );
  }, [availableCurricularObjectives, activity.transversalCores]);

  const specificCurricularObjectives = useMemo(() => {
    return availableCurricularObjectives.filter((co) => 
      co.core.type === 'specific' && 
      activity.specificCores.includes(co.core.id)
    );
  }, [availableCurricularObjectives, activity.specificCores]);

  // Filter 2: CurricularObjective → Objectives
  // Show only Objectives that belong to selected CurricularObjectives
  const availableObjectives = useMemo(() => {
    const selectedCurricularObjectiveIds = [
      ...activity.transversalCurricularObjectives,
      ...activity.specificCurricularObjectives,
    ];

    if (selectedCurricularObjectiveIds.length === 0) {
      return [];
    }

    // Filter objectives that belong to selected curricular objectives
    return reportObjectives.filter((objective) => {
      if (!objective.curricularObjective) return false;
      return selectedCurricularObjectiveIds.includes(objective.curricularObjective.id);
    });
  }, [
    activity.transversalCurricularObjectives,
    activity.specificCurricularObjectives,
    reportObjectives,
  ]);

  // Split objectives by type based on their core
  const transversalObjectives = useMemo(() => {
    return availableObjectives.filter((obj) => 
      obj.core.type === 'transversal' && 
      activity.transversalCores.includes(obj.core.id)
    );
  }, [availableObjectives, activity.transversalCores]);

  const specificObjectives = useMemo(() => {
    return availableObjectives.filter((obj) => 
      obj.core.type === 'specific' && 
      activity.specificCores.includes(obj.core.id)
    );
  }, [availableObjectives, activity.specificCores]);

  // Filter 3: Objective → SubObjectives
  // Show only SubObjectives that belong to selected Objectives
  const availableSubObjectives = useMemo(() => {
    const selectedObjectiveIds = [
      ...activity.transversalObjectives,
      ...activity.specificObjectives,
    ];

    if (selectedObjectiveIds.length === 0) {
      return [];
    }

    // Filter sub-objectives that belong to selected objectives
    return subObjectives.filter((subObj) => {
      if (!subObj.objective) return false;
      return selectedObjectiveIds.includes(subObj.objective.id);
    });
  }, [
    activity.transversalObjectives,
    activity.specificObjectives,
    subObjectives,
  ]);

  // Split sub-objectives by type based on their core
  const transversalSubObjectives = useMemo(() => {
    return availableSubObjectives.filter((subObj) => 
      subObj.core.type === 'transversal' && 
      activity.transversalCores.includes(subObj.core.id)
    );
  }, [availableSubObjectives, activity.transversalCores]);

  const specificSubObjectives = useMemo(() => {
    return availableSubObjectives.filter((subObj) => 
      subObj.core.type === 'specific' && 
      activity.specificCores.includes(subObj.core.id)
    );
  }, [availableSubObjectives, activity.specificCores]);

  // Get all curricular objectives for lookup
  const allCurricularObjectivesFromCores = useMemo(() => {
    const map = new Map();
    cores.forEach((core) => {
      if (core.curricularObjectives) {
        core.curricularObjectives.forEach((co) => {
          if (!map.has(co.id)) {
            map.set(co.id, co);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [cores]);

  const selectedTransversalCurricularObjectives = useMemo(() => {
    return activity.transversalCurricularObjectives.reduce((acc, coId) => {
      const co = allCurricularObjectivesFromCores.find((objective) => objective.id === coId);
      if (co) acc.push(co);
      return acc;
    }, []);
  }, [activity.transversalCurricularObjectives, allCurricularObjectivesFromCores]);

  const selectedSpecificCurricularObjectives = useMemo(() => {
    return activity.specificCurricularObjectives.reduce((acc, coId) => {
      const co = allCurricularObjectivesFromCores.find((objective) => objective.id === coId);
      if (co) acc.push(co);
      return acc;
    }, []);
  }, [activity.specificCurricularObjectives, allCurricularObjectivesFromCores]);

  const availableConsequentialCurricularObjectives = useMemo(() => {
    return dynamicConsequentialCurricularObjectives.filter((cco) => (
      cco.specificCurricularObjectives.some(id => activity.specificCurricularObjectives.includes(id)) &&
      cco.transversalCurricularObjectives.some(id => activity.transversalCurricularObjectives.includes(id))
    ));
  }, [activity.specificCurricularObjectives, activity.transversalCurricularObjectives, dynamicConsequentialCurricularObjectives]);

  // ========== UI STATE HELPERS ==========
  
  const noSelectedLevels = useMemo(() => (
    activity.recommendedLevels.length === 0
  ), [activity.recommendedLevels]);

  const noSelectedTransversalCores = useMemo(() => (
    activity.transversalCores.length === 0
  ), [activity.transversalCores]);

  const noSelectedSpecificCores = useMemo(() => (
    activity.specificCores.length === 0
  ), [activity.specificCores]);

  const noSelectedBothCurricularObjectives = useMemo(() => (
    activity.transversalCurricularObjectives.length === 0 || activity.specificCurricularObjectives.length === 0
  ), [activity.transversalCurricularObjectives, activity.specificCurricularObjectives]);

  // ========== HANDLERS ==========

  const handleTextFieldChange = (e) => {
    const { target: { value, name } } = e;
    setActivity((oldActivity) => ({ ...oldActivity, [name]: value }));
  }

  const handleDescriptionChange = (description) => {
    setActivity((oldActivity) => ({ ...oldActivity, description }));
  }

  const handleMaterialsChange = (materials) => {
    setActivity((oldActivity) => ({ ...oldActivity, materials }));
  }

  const handleAssetChange = (assets) => setActivity((oldActivity) => ({ ...oldActivity, assets }));

  const handleMultipleSelectChange = (event) => {
    const {
      target: { name, value },
    } = event;

    if (value.length > 0 && value.includes(undefined)) return;

    setActivity((oldActivity) => ({
      ...oldActivity,
      [name]: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleSingleSelectChange = ({ target: { name, value } }) => {
    setActivity((oldActivity) => ({
      ...oldActivity,
      [name]: value
    }));
  }

  const handleCurricularObjectiveChange = (event) => {
    const { target: { value, name } } = event;
    
    // When removing a curricular objective, also remove dependent objectives and sub-objectives
    if (value.length < activity[name].length) {
      const removed = difference(activity[name], value)[0];
      const consequentialsToBeRemoved = dynamicConsequentialCurricularObjectives.filter((cco) => (
        cco[name].includes(removed)
      ));
      setActivity((oldActivity) => ({
        ...oldActivity,
        consequentialCurricularObjectives: difference(oldActivity.consequentialCurricularObjectives, consequentialsToBeRemoved.map(idMapper))
      }));
      
      // Remove objectives that depend on removed curricular objectives
      const type = name === 'transversalCurricularObjectives' ? 'transversal' : 'specific';
      const objectivesToRemove = reportObjectives
        .filter(obj => obj.curricularObjective?.id === removed)
        .map(obj => obj.id);
      
      if (objectivesToRemove.length > 0) {
        setActivity((oldActivity) => ({
          ...oldActivity,
          [`${type}Objectives`]: oldActivity[`${type}Objectives`].filter(id => !objectivesToRemove.includes(id))
        }));
        
        // Remove sub-objectives that depend on removed objectives
        const subObjectivesToRemove = subObjectives
          .filter(subObj => objectivesToRemove.includes(subObj.objective?.id))
          .map(subObj => subObj.id);
        
        if (subObjectivesToRemove.length > 0) {
          setActivity((oldActivity) => ({
            ...oldActivity,
            [`${type}SubObjectives`]: oldActivity[`${type}SubObjectives`].filter(id => !subObjectivesToRemove.includes(id))
          }));
        }
      }
    }
    
    handleMultipleSelectChange(event);
  }

  const handleBack = () => {
    router.back();
  };

  const handleCreateSubObjective = (subObjective, type) => {
    setSubObjectives((oldValue) => [subObjective, ...oldValue]);
    setActivity((oldActivity) => ({
      ...oldActivity,
      [`${type}SubObjectives`]: [...oldActivity[`${type}SubObjectives`], subObjective.id]
    }));
  }

  const handleCreateObjective = (objective, type) => {
    setReportObjectives((oldValue) => [objective, ...oldValue]);
    setActivity((oldActivity) => ({
      ...oldActivity,
      [`${type}Objectives`]: [...oldActivity[`${type}Objectives`], objective.id]
    }));
  }

  const handleCreateConsequentialCurricularObjective = (consequentialCurricularObjective) => {
    setDynamicConsequentialCurricularObjectives((oldValue) => [consequentialCurricularObjective, ...oldValue]);
    setActivity((oldActivity) => ({
      ...oldActivity,
      consequentialCurricularObjectives: [
        ...oldActivity.consequentialCurricularObjectives,
        consequentialCurricularObjective.id,
      ],
    }));
  }

  const cleanActionResponse = () => {
    setActionResponse({ loading: false, error: false, success: false });
  };

  const cleanseActivity = () => {
    const cleanedActivity = { ...activity };

    // Filter out invalid selections based on current filters
    cleanedActivity.specificCurricularObjectives = activity.specificCurricularObjectives.filter(
      (id) => specificCurricularObjectives.some(co => co.id === id)
    );
    cleanedActivity.transversalCurricularObjectives = activity.transversalCurricularObjectives.filter(
      (id) => transversalCurricularObjectives.some(co => co.id === id)
    );
    cleanedActivity.specificObjectives = activity.specificObjectives.filter(
      (id) => specificObjectives.some(obj => obj.id === id)
    );
    cleanedActivity.transversalObjectives = activity.transversalObjectives.filter(
      (id) => transversalObjectives.some(obj => obj.id === id)
    );
    cleanedActivity.specificSubObjectives = activity.specificSubObjectives.filter(
      (id) => specificSubObjectives.some(subObj => subObj.id === id)
    );
    cleanedActivity.transversalSubObjectives = activity.transversalSubObjectives.filter(
      (id) => transversalSubObjectives.some(subObj => subObj.id === id)
    );

    const activityCores = [...activity.transversalCores, ...activity.specificCores];
    cleanedActivity.coresNames = cores.filter((core) => activityCores.includes(core.id)).map((core) => core.name);

    return cleanedActivity;
  }

  const handleSave = async ({ autoSave }) => {
    setActionResponse({ loading: !autoSave })
    const cleanActivity = cleanseActivity();
    try {
      await axios.patch(`/api/institutions/${institutionId}/activities/${cleanActivity.id}`, cleanActivity);
      if (!autoSave) {
        if (cleanActivity.fromSuggestion) {
          // trackCreateSuggestedActivity();
        }
        const { returnUrl, classroomId, date } = router.query;
        if (returnUrl && classroomId && date) {
          await axios.post(`/api/institutions/${institutionId}/activities/${cleanActivity.id}/plan`, {
            classroom: classroomId,
            date,
          })
          router.replace(router.query.returnUrl);
        } else {
          router.back();
        }
      }
    } catch (error) {
      console.error(error);
      setActionResponse({ error: true });
    }
  };

  const handleExperienceSuggestion = async () => {
    setSuggestExperienceLoading(true);

    const nameMapper = (item) => item.name;
    try {
      const ages = levels.filter(
        (level) => activity.recommendedLevels.includes(level.id)
      ).reduce((acc, level) => {
        acc.push(level.ageUpTo);
        acc.push(level.ageFrom);
        return acc;
      }, [])
      const selectedCores = cores.filter(
        (core) => [...activity.transversalCores, ...activity.specificCores].includes(core.id)
      ).map(nameMapper).join(', ');
      const selectedCurricularObjectives = allCurricularObjectivesFromCores.filter(
        (curricularObjective) => [
          ...activity.transversalCurricularObjectives,
          ...activity.specificCurricularObjectives
        ].includes(curricularObjective.id)
      ).map(nameMapper).join(', ');
      const selectedObjectives = reportObjectives.filter(
        (objective) => [
          ...activity.transversalObjectives,
          ...activity.specificObjectives,
        ].includes(objective.id)
      ).map(nameMapper).join(', ');
      const selectedSubObjectives = subObjectives.filter(
        (subObjective) => [
          ...activity.transversalSubObjectives,
          ...activity.specificSubObjectives,
        ].includes(subObjective.id)
      ).map(nameMapper).join(', ');

      let query = `ageMin=${Math.min(...ages)}`;
      query += `&ageMax=${Math.max(...ages)}`;
      query += `&cores=${selectedCores}`;
      query += `&curricularObjectives=${selectedCurricularObjectives}`;
      query += `&objectives=${selectedObjectives}`;
      query += `&subObjectives=${selectedSubObjectives}`;

      // trackRequestSuggestActivity()
      const response = await axios.get(`/api/institutions/${institutionId}/activities/suggest?${query}`);
      // trackWaitedForSuggestedActivity();
      setActivity((oldActivity) => ({
        ...oldActivity,
        description: openAiResponseToHTML(response.data),
        fromSuggestion: true,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setSuggestExperienceLoading(false);
    }
  };

  const RecommendExperienceButton = () => {
    const { plansFromIndividualStandOut } = usePlans();
    const handleNeedsToUpgrade = usePlanUpgradeWarning();
    if (!plansFromIndividualStandOut.includes(plan)) {
      return (
        <Button
          variant="outlined"
          startIcon={<LockOutlined />}
          onClick={handleNeedsToUpgrade}
          sx={{ mb: 2 }}
        >
          Recomiéndame una experiencia
        </Button>
      )
    }
    return (
      <LoadingButton
        variant="outlined"
        startIcon={<AutoFixHigh />}
        onClick={handleExperienceSuggestion}
        loading={suggestExperienceLoading}
        sx={{ mb: 2 }}
      >
        Recomiéndame una experiencia
      </LoadingButton>
    )
  }

  return (
    <>
      <Head>
        <title>
          Editar experiencia
        </title>
      </Head>
      <Stack mb={2}>
        <TutorialLink id="171ac20277b848d093e09091ec305d27" />
      </Stack>
      <Grid container spacing={2} pb={8}>
        <Grid item xs={12} sm={12} md={6}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            label="Nombre de la experiencia"
            name="name"
            value={activity.name}
            onChange={handleTextFieldChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UngaSelect
            fullWidth
            label="Temática (opcional)"
            labelId="select-theme-label"
            name="theme"
            id="select-theme"
            value={activity.theme}
            onChange={handleSingleSelectChange}
            options={themes}
            noSelectionValue={<MenuItem value="">Sin temática</MenuItem>}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UngaSelect
            fullWidth
            label="Niveles recomendados"
            labelId="select-recommended-level-label"
            name="recommendedLevels"
            id="select-recommended-level"
            multiple
            value={activity.recommendedLevels}
            onChange={handleMultipleSelectChange}
            options={levels}
            errorText="Escoge al menos un nivel recomendado"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <UngaSelect
            fullWidth
            label="Núcleos transversales"
            labelId="select-related-transversal-cores-label"
            name="transversalCores"
            id="select-related-transversal-cores"
            multiple
            value={activity.transversalCores}
            onChange={handleMultipleSelectChange}
            options={transversalCores}
            errorText="Escoge al menos un núcleo transversal o específico"
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <UngaSelectObjectives
            multiple
            fullWidth
            label="OAT"
            objectives={transversalCurricularObjectives}
            filteredCores={activity.transversalCores}
            filteredLevels={activity.recommendedLevels}
            sx={{
              display: (noSelectedLevels || noSelectedTransversalCores) && 'none',
            }}
            labelId="select-related-transversal-curricular-objectives-label"
            name="transversalCurricularObjectives"
            id="select-related-transversal-curricular-objectives"
            value={activity.transversalCurricularObjectives}
            onChange={handleCurricularObjectiveChange}
            allCores={cores}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <UngaSelect
            fullWidth
            label="Otros núcleos"
            labelId="select-related-specific-cores-label"
            name="specificCores"
            id="select-related-specific-cores"
            multiple
            value={activity.specificCores}
            onChange={handleMultipleSelectChange}
            options={specificCores}
            errorText="Escoge al menos un núcleo transversal o específico"
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <UngaSelectObjectives
            fullWidth
            multiple
            label="OA"
            objectives={specificCurricularObjectives}
            filteredCores={activity.specificCores}
            filteredLevels={activity.recommendedLevels}
            sx={{
              display: (noSelectedLevels || noSelectedSpecificCores) && 'none',
            }}
            labelId="select-related-specific-curricular-objectives-label"
            name="specificCurricularObjectives"
            id="select-related-specific-curricular-objectives"
            value={activity.specificCurricularObjectives}
            onChange={handleCurricularObjectiveChange}
            allCores={cores}
          />
        </Grid>
        <Grid item xs={12}>
          <UngaSelect
            fullWidth
            multiple
            maxWidth="inherit"
            label="OE (opcional)"
            options={availableConsequentialCurricularObjectives}
            sx={{
              display: noSelectedBothCurricularObjectives && 'none',
            }}
            labelId="select-related-consequential-curricular-objectives-label"
            name="consequentialCurricularObjectives"
            id="select-related-consequential-curricular-objectives"
            value={activity.consequentialCurricularObjectives}
            onChange={handleMultipleSelectChange}
            onCreateNew={() => setAddNewConsequentialCurricularObjective(true)}
          />
        </Grid>
        <Grid
          item
          xs={12}
          my={2}
          sx={{ display: (noSelectedLevels || (noSelectedTransversalCores && noSelectedSpecificCores)) && 'none' }}
        >
          <ObjectiveForActivityEvaluationSelector
            availableCores={selectedCores}
            availableClassrooms={classrooms}
            availableLevelsIds={activity.recommendedLevels}
            reportObjectives={reportObjectives}
            subObjectives={subObjectives}
            activity={activity}
            hideTransversal={(noSelectedLevels || noSelectedTransversalCores)}
            hideSpecific={(noSelectedLevels || noSelectedSpecificCores)}
            hideSubObjectives
            handleSelectChange={handleMultipleSelectChange}
            onCreateSubObjective={handleCreateSubObjective}
            onCreateObjective={handleCreateObjective}
          />
        </Grid>
        <Grid item xs={12} mb={{ xs: 10, sm: 6 }}>
          <Typography variant="h6">¿En qué consiste y cómo se realiza la experiencia?</Typography>
          <Typography variant="body2" mb={1}>Puedes agregar toda la información adicional que necesites (habilidades, valores, etc).</Typography>
          {(features?.includes('suggestExperiencies') &&
            (!noSelectedLevels && (!noSelectedTransversalCores || !noSelectedSpecificCores))
          ) && (
              <RecommendExperienceButton />
            )}
          <Editor
            value={activity.description}
            onChange={handleDescriptionChange}
            style={{ height: 400 }}
          />
        </Grid>
        <Grid item xs={12} mb={2}>
          <Typography variant="h6" mb={1}>¿Qué materiales necesitas?</Typography>
          <MaterialsInput onChange={handleMaterialsChange} values={activity.materials} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" mb={1}>¿Alguna información adicional?</Typography>
          <Accordion
            expanded={showAdvancedOptions}
            onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <AccordionSummary
              aria-controls="advanced-options-content"
              id="advanced-options-header"
              expandIcon={<GridExpandMoreIcon />}
            >
              <Stack>
                <Typography sx={{ color: 'text.secondary' }}>Origen de la idea, participación de la familia, rol del adulto y material digital</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <>
                <Stack mb={2}>
                  <Typography variant="h6" mb={1}>¿Cuál es el origen de la idea? (opcional)</Typography>
                  <Stack spacing={1}>
                    <UngaSelect
                      name="ideaOrigin"
                      label="Origen de la idea"
                      options={IDEA_ORIGIN_OPTIONS}
                      value={activity.ideaOrigin}
                      onChange={handleSingleSelectChange}
                      noSelectionValue={<MenuItem value="">Sin origen seleccionado</MenuItem>}
                      mapFunction={(option) => (
                        <MenuItem key={option} value={option}>
                          <ListItemText primary={option} />
                        </MenuItem>
                      )}
                      renderValue={(opt) => (
                        <Chip
                          key={opt}
                          label={opt}
                          color="info"
                        />
                      )}
                      sx={{ width: { xs: '100%', sm: '50%' } }}
                    />
                    <TextField
                      multiline
                      rows={2}
                      name="ideaOriginDetails"
                      label="Añade más detalles"
                      value={activity.ideaOriginDetails}
                      onChange={handleTextFieldChange}
                      sx={{ width: { xs: '100%', sm: '50%' } }}
                    />
                  </Stack>
                </Stack>
                <Stack mb={2}>
                  <Typography variant="h6" mb={1}>¿Cuál es el rol del adulto? (opcional)</Typography>
                  <TextField
                    multiline
                    fullWidth
                    rows={3}
                    name="adultRole"
                    label="Describe cuál es el rol del adulto"
                    value={activity.adultRole}
                    onChange={handleTextFieldChange}
                  />
                </Stack>
                <Stack mb={2}>
                  <Typography variant="h6" mb={1}>¿De qué manera participa la familia? (opcional)</Typography>
                  <TextField
                    multiline
                    fullWidth
                    rows={3}
                    name="familyParticipation"
                    label="Describe cómo se involucra la familia"
                    value={activity.familyParticipation}
                    onChange={handleTextFieldChange}
                  />
                </Stack>
                <Typography variant="h6" mb={2}>¿Qué material digital necesitas?</Typography>
                <CloudinaryUploadWidget
                  assets={activity.assets}
                  onAssetChange={handleAssetChange}
                  type="pdf"
                  buttonTitle={Object.keys(activity.assets).length === 0 ? 'Subir archivos' : 'Subir más archivos'}
                  buttonIcon={<Upload />}
                  ref={assetsComponentRef}
                />
              </>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12} mt={4}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="outlined" color="error" onClick={handleBack}>
                Volver
              </Button>
            </Grid>
            <Grid item xs={12} sm={8}>
              <LoadingButton
                fullWidth
                endIcon={<SaveOutlined />}
                loading={actionResponse.loading}
                loadingPosition="end"
                variant="contained"
                onClick={handleSave}
              >
                Guardar (ult. guardado hace aprox. {secondsSinceLastSave} segundos)
              </LoadingButton>
            </Grid>
          </Grid>
        </Grid>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={actionResponse.error}
          onClose={cleanActionResponse}
          autoHideDuration={5000}
        >
          <Alert onClose={cleanActionResponse} severity="error" sx={{ width: '100%' }}>
            No se pudieron guardar los cambios
          </Alert>
        </Snackbar>
        <Dialog
          open={addNewConsequentialCurricularObjective}
          onClose={() => setAddNewConsequentialCurricularObjective(false)}
          PaperProps={{
            sx: { p: 2, minWidth: '50vw' }
          }}
        >
          <AddNewConsequentialCurricularObjective
            transversalCurricularObjectives={selectedTransversalCurricularObjectives}
            specificCurricularObjectives={selectedSpecificCurricularObjectives}
            onClose={() => setAddNewConsequentialCurricularObjective(false)}
            institutionId={institutionId}
            onCreate={(consequentialCurricularObjective) => handleCreateConsequentialCurricularObjective(consequentialCurricularObjective)}
          />
        </Dialog>
      </Grid>
    </>
  )
}
