import { Dialog, FormControl, FormControlLabel, Grid, Radio, RadioGroup, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import UngaSelectObjectives from "../utils/UngaSelectObjectives";
import NewSubObjectiveForm from "../subObjectives/NewForm";
import NewObjectiveForm from "./NewForm";

export default function ObjectiveForActivityEvaluationSelector({
  availableCores,
  availableLevelsIds,
  availableClassrooms,
  reportObjectives,
  subObjectives,
  activity,
  hideTransversal,
  hideSpecific,
  hideSubObjectives = false,
  handleSelectChange,
  onCreateSubObjective,
  onCreateObjective,
}) {
  const [willEvaluateReportObjectives, setWillEvaluateReportObjectives] = useState('no');
  const [willEvaluateSubObjectives, setWillEvaluateSubObjectives] = useState('no');
  const [addNewObjective, setAddNewObjective] = useState({
    open: false,
    type: 'transversal',
    objectiveType: 'report',
  });

  const transversalCoresAvailable = useMemo(() => availableCores.filter((core) => core.type === 'transversal'), [availableCores]);
  const transversalCoresAvailableIds = useMemo(() => transversalCoresAvailable.map((core) => core.id), [transversalCoresAvailable]);
  const specificCoresAvailable = useMemo(() => availableCores.filter((core) => core.type === 'specific'), [availableCores])
  const specificCoresAvailableIds = useMemo(() => specificCoresAvailable.map((core) => core.id), [specificCoresAvailable]);

  useEffect(() => {
    if (activity.transversalObjectives.length > 0 || activity.specificObjectives.length > 0) {
      setWillEvaluateReportObjectives('yes');
    }
    if (activity.transversalSubObjectives.length > 0 || activity.specificSubObjectives.length > 0) {
      setWillEvaluateSubObjectives('yes');
    }
  }, [activity])

  const closeDialog = () => setAddNewObjective((oldValue) => ({ ...oldValue, open: false }));

  const handleCreateObjective = (objective) => {
    onCreateObjective(objective, addNewObjective.type);
    closeDialog();
  }

  const handleCreateSubObjective = (subObjective) => {
    onCreateSubObjective(subObjective, addNewObjective.type);
    closeDialog();
  }

  return (
    <>
      <Typography variant="h6">¿Evaluarás directamente algún indicador del informe?</Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>Un indicador de informe es aquel que aparece directamente en el informe que se entrega a los apoderados.</Typography>
      <FormControl sx={{ mb: 1 }}>
        <RadioGroup
          sx={{ display: 'flex', flexDirection: 'row' }}
          aria-labelledby="radio-report-objective"
          name="radio-buttons-group-report-objective"
          value={willEvaluateReportObjectives}
          onChange={({ target: { value } }) => setWillEvaluateReportObjectives(value)}
        >
          <FormControlLabel value="no" control={<Radio />} label="No" />
          <FormControlLabel value="yes" control={<Radio />} label="Sí" />
        </RadioGroup>
      </FormControl>
      {willEvaluateReportObjectives === 'yes' && (
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6}>
            <UngaSelectObjectives
              fullWidth
              multiple
              label="Indicadores de informe transversales"
              objectives={reportObjectives}
              filteredCores={transversalCoresAvailableIds}
              filteredLevels={availableLevelsIds}
              filteredCurricularObjectives={activity.transversalCurricularObjectives}
              sx={{ display: (hideTransversal || transversalCoresAvailable.length === 0) && 'none' }}
              labelId="select-related-transversal-report-objectives-label"
              name="transversalObjectives"
              id="select-related-transversal-report-objectives"
              value={activity.transversalObjectives}
              onChange={handleSelectChange}
              onCreateNew={() => setAddNewObjective({ type: 'transversal', open: true, objectiveType: 'report' })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <UngaSelectObjectives
              fullWidth
              multiple
              label="Indicadores de informe específicos"
              objectives={reportObjectives}
              filteredCores={specificCoresAvailableIds}
              filteredLevels={availableLevelsIds}
              filteredCurricularObjectives={activity.specificCurricularObjectives}
              sx={{ display: (hideSpecific || specificCoresAvailable.length === 0) && 'none' }}
              labelId="select-related-specific-report-objectives-label"
              name="specificObjectives"
              id="select-related-specific-report-objectives"
              value={activity.specificObjectives}
              onChange={handleSelectChange}
              onCreateNew={() => setAddNewObjective({ type: 'specific', open: true, objectiveType: 'report' })}
            />
          </Grid>
        </Grid>
      )}
      {!hideSubObjectives && (
        <>
          <Typography variant="h6">¿Evaluarás algún indicador de evaluación?</Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>Un indicador de evaluación es aquel que se usa para evaluar cosas más específicas, principalmente cuando un indicador de informe es muy amplio. Se vinculan a un indicador del informe para poder calcular automáticamente el avance.</Typography>
          <FormControl>
            <RadioGroup
              sx={{ display: 'flex', flexDirection: 'row' }}
              aria-labelledby="radio-sub-objective"
              defaultValue="no"
              name="radio-buttons-group-sub-objective"
              value={willEvaluateSubObjectives}
              onChange={({ target: { value } }) => setWillEvaluateSubObjectives(value)}
            >
              <FormControlLabel value="no" control={<Radio />} label="No" />
              <FormControlLabel value="yes" control={<Radio />} label="Sí" />
            </RadioGroup>
          </FormControl>
          {willEvaluateSubObjectives === 'yes' && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <UngaSelectObjectives
                  fullWidth
                  multiple
                  label="Indicadores de evaluación transversales"
                  objectives={subObjectives}
                  filteredCores={transversalCoresAvailableIds}
                  filteredLevels={availableLevelsIds}
                  filteredCurricularObjectives={activity.transversalCurricularObjectives}
                  filteredObjectives={activity.transversalObjectives}
                  sx={{ display: (hideTransversal || transversalCoresAvailable.length === 0) && 'none' }}
                  labelId="select-related-transversal-sub-objectives-label"
                  name="transversalSubObjectives"
                  id="select-related-transversal-sub-objectives"
                  value={activity.transversalSubObjectives}
                  onChange={handleSelectChange}
                  onCreateNew={() => setAddNewObjective({ type: 'transversal', open: true, objectiveType: 'sub' })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <UngaSelectObjectives
                  fullWidth
                  multiple
                  label="Indicadores de evaluación específicos"
                  objectives={subObjectives}
                  filteredCores={specificCoresAvailableIds}
                  filteredLevels={availableLevelsIds}
                  filteredCurricularObjectives={activity.specificCurricularObjectives}
                  filteredObjectives={activity.specificObjectives}
                  sx={{ display: (hideSpecific || specificCoresAvailable.length === 0) && 'none' }}
                  labelId="select-related-specific-sub-objectives-label"
                  name="specificSubObjectives"
                  id="select-related-specific-sub-objectives"
                  value={activity.specificSubObjectives}
                  onChange={handleSelectChange}
                  onCreateNew={() => setAddNewObjective({ type: 'specific', open: true, objectiveType: 'sub' })}
                />
              </Grid>
            </Grid>
          )}
        </>
      )}
      <Dialog
        open={addNewObjective.open}
        onClose={closeDialog}
        PaperProps={{
          sx: { p: 2, minWidth: '50vw' }
        }}
      >
        {addNewObjective.objectiveType === 'sub' ? (
          <NewSubObjectiveForm
            objectives={reportObjectives}
            onClose={closeDialog}
            availableCores={eval(`${addNewObjective.type}CoresAvailable`)}
            availableLevelsIds={availableLevelsIds}
            onCreate={(subObjective) => handleCreateSubObjective(subObjective)}
          />
        ) : (
          <NewObjectiveForm
            onClose={closeDialog}
            availableCores={eval(`${addNewObjective.type}CoresAvailable`)}
            availableClassrooms={availableClassrooms}
            onCreate={(objective) => handleCreateObjective(objective)}
          />
        )}
      </Dialog>
    </>
  )
}