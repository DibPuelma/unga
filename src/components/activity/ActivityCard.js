import { useMemo, useState, Fragment, useContext } from "react";
import { Box, Button, Checkbox, Chip, Grid, Stack, Typography } from "@mui/material";

import styles from 'src/styles/noScrollbar.module.css';
import AssetShowcase from "../assets/AssetShowcase";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { SCOPES_FOR_CORE } from "src/helpers/businessLogic";
import { uniqBy } from "lodash";
import ActivityCreator from "./ActivityCreator";

export default function ActivityCard({ activity, onSelect }) {
  const {
    id,
    name,
    recommendedLevels = [],
    cores = [],
    objectives = [],
    subObjectives = [],
    curricularObjectives = [],
    consequentialCurricularObjectives = [],
    ideaOrigin,
    ideaOriginDetails,
    description,
    familyParticipation,
    adultRole,
    assets,
    materials = [],
    theme,
  } = activity || {}

  const [checked, setChecked] = useState(false);
  const [showObjectives, setShowObjectives] = useState(true);
  const [showSubObjectives, setShowSubObjectives] = useState(true);
  const [showCurricularObjectives, setShowCurricularObjectives] = useState(true);

  const objectivesByCore = useMemo(() => {
    const result = {};
    if (!objectives || !Array.isArray(objectives) || !cores || !Array.isArray(cores)) {
      return result;
    }
    uniqBy(objectives, (objective) => objective.id).forEach((objective) => {
      if (!objective?.core?.id) return;
      const coreId = objective.core.id;
      const core = cores.find((core) => core.id === coreId);
      if (!core) return;

      if (!result[core.name]) {
        result[core.name] = [];
      }
      result[core.name].push(objective.name)
    })
    return result;
  }, [objectives, cores])

  const curricularObjectivesByCore = useMemo(() => {
    const result = {};
    if (!curricularObjectives || !Array.isArray(curricularObjectives) || !cores || !Array.isArray(cores)) {
      return result;
    }
    curricularObjectives.forEach((curricularObjective) => {
      // Curricular objectives now have a coreId and Cores relation
      const coreId = curricularObjective.coreId || curricularObjective.Cores?.id;
      if (!coreId) return;
      
      const core = cores.find((c) => c.id === coreId);
      if (!core) return;

      if (!result[core.name]) {
        result[core.name] = [];
      }
      result[core.name].push(curricularObjective.name);
    });
    return result;
  }, [curricularObjectives, cores])

  const subObjectivesByCore = useMemo(() => {
    const result = {};
    if (!subObjectives || !Array.isArray(subObjectives) || !cores || !Array.isArray(cores)) {
      return result;
    }
    uniqBy(subObjectives, (subObjective) => subObjective.id).forEach((subObjective) => {
      if (!subObjective?.core?.id) return;
      const coreId = subObjective.core.id;
      const core = cores.find((core) => core.id === coreId);
      if (!core) return;

      if (!result[core.name]) {
        result[core.name] = [];
      }
      result[core.name].push(subObjective.name)
    })
    return result;
  }, [subObjectives, cores])

  const handleCheck = ({ target: { checked } }) => {
    setChecked(checked);
    onSelect(checked, activity);
  }

  const toggleShowCurricularObjectives = () => setShowCurricularObjectives(!showCurricularObjectives);

  const toggleShowObjectives = () => setShowObjectives(!showObjectives);
  const toggleShowSubObjectives = () => setShowSubObjectives(!showSubObjectives);

  return (
    <Box mb={2}>
      <Grid container>
        <Grid item xs={12} mt={1} pr={2}>
          <ActivityCreator activity={activity} size="large" />
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            {onSelect && (
              <Checkbox
                checked={checked}
                onChange={handleCheck}
                inputProps={{ 'aria-label': 'Select activity' }}
              />
            )}
            <Typography variant="h6">{name}</Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} mb={1}>
          {theme && (
            <Chip color="success" size="small" label={`Temática: ${theme.name.toLowerCase()}`} />
          )}
        </Grid>
        <Grid item xs={12}>
          <Stack
            spacing={1}
            direction="row"
            overflow="scroll"
            maxWidth="100%"
            className={styles.noScrollbar}
          >
            {recommendedLevels.map((rl, i) => (
              <Chip key={rl.name} color="warning" size="small" label={rl.name} />
            ))}
          </Stack>
        </Grid>
      </Grid>
      <Box>
        <Stack
          direction="row"
          flexWrap="wrap"
          mb={3}
          alignItems="center"
          maxWidth="100%"
          overflow="scroll"
          className={styles.noScrollbar}
        >
          {cores.map((core, i) => (
            <Chip
              sx={{ mr: 1, mt: 1 }}
              component="span"
              key={core.name}
              color="info"
              size="small"
              label={`${core.name} / ${SCOPES_FOR_CORE[core.name]}`}
            />
          ))}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          {Object.keys(curricularObjectivesByCore).length > 0 && (
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={4}>
                <Typography variant="subtitle2" fontWeight="bold">Objetivos curriculares</Typography>
                <Button onClick={toggleShowCurricularObjectives} endIcon={showCurricularObjectives ? <ExpandLess /> : <ExpandMore />}>
                  {showCurricularObjectives ? 'ocultar' : 'mostrar'}
                </Button>
              </Stack>
              {showCurricularObjectives && Object.entries(curricularObjectivesByCore).map(([core, curricularObjectives]) => (
                <Fragment key={core}>
                  <Typography variant="caption" component="div" mt={1} fontWeight="bold">
                    {core}
                  </Typography>
                  {curricularObjectives.map((curricularObjective) => (
                    <Typography key={curricularObjective} fontSize={12} component="div">
                      {curricularObjective}
                    </Typography>
                  ))}
                </Fragment>
              ))}
              {showCurricularObjectives && consequentialCurricularObjectives.length > 0 && (
                <>
                  <Typography variant="caption" component="div" mt={1} fontWeight="bold">
                    Objetivos específicos
                  </Typography>
                  {consequentialCurricularObjectives.map((cco) => (
                    <Typography key={cco.id} fontSize={12} component="div">
                      {cco.name}
                    </Typography>
                  ))}
                </>
              )}
            </Box>
          )}
          {Object.keys(objectivesByCore).length > 0 && (
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={4}>
                <Typography variant="subtitle2" fontWeight="bold">Indicadores</Typography>
                <Button onClick={toggleShowObjectives} endIcon={showObjectives ? <ExpandLess /> : <ExpandMore />}>
                  {showObjectives ? 'ocultar' : 'mostrar'}
                </Button>
              </Stack>
              {showObjectives && Object.entries(objectivesByCore).map(([core, objectives]) => (
                <Fragment key={core}>
                  <Typography key={core} variant="caption" component="div" mt={1} fontWeight="bold">
                    {core}
                  </Typography>
                  {objectives.map((objective) => (
                    <Typography key={objective} fontSize={12} component="div">{objective}</Typography>
                  ))}
                </Fragment>
              ))}
            </Box>
          )}
          {Object.keys(subObjectivesByCore).length > 0 && (
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={4}>
                <Typography variant="subtitle2" fontWeight="bold">Indicadores de evaluación</Typography>
                <Button onClick={toggleShowSubObjectives} endIcon={showSubObjectives ? <ExpandLess /> : <ExpandMore />}>
                  {showSubObjectives ? 'ocultar' : 'mostrar'}
                </Button>
              </Stack>
              {showSubObjectives && Object.entries(subObjectivesByCore).map(([core, subObjectives]) => (
                <Fragment key={core}>
                  <Typography key={core} variant="caption" component="div" mt={1} fontWeight="bold">
                    {core}
                  </Typography>
                  {subObjectives.map((subObjective) => (
                    <Typography key={subObjective} fontSize={12} component="div">{subObjective}</Typography>
                  ))}
                </Fragment>
              ))}
            </Box>
          )}
        </Stack>
        <>
          {ideaOrigin && (
            <Box mb={2}>
              <Typography variant="subtitle2">Origen de la idea</Typography>
              <Typography variant="caption">
                {ideaOrigin}{ideaOriginDetails ? `: ${ideaOriginDetails}` : ''}
              </Typography>
            </Box>
          )}
          <Box mb={2}>
            <Typography variant="subtitle2">Descripción</Typography>
            <Box
              fontSize={12}
              mt={-1}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </Box>
          {familyParticipation && (
            <Box mb={2}>
              <Typography variant="subtitle2">Participación de la familia</Typography>
              <Typography variant="caption">
                {familyParticipation}
              </Typography>
            </Box>
          )}
          {adultRole && (
            <Box mb={2}>
              <Typography variant="subtitle2">Rol del adulto</Typography>
              <Typography variant="caption">
                {adultRole}
              </Typography>
            </Box>
          )}
          {materials.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>Materiales</Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="caption" flex={2}><b>Nombre</b></Typography>
                <Typography variant="caption" flex={1} align="right"><b>Cantidad</b></Typography>
              </Stack>
              {materials.map((material) => (
                <Stack key={material.name} direction="row" spacing={2} alignItems="center">
                  <Typography variant="caption" flex={2}>{material.name}</Typography>
                  <Typography variant="caption" flex={1} align="right">{material.quantityText}</Typography>
                </Stack>
              ))}
            </Box>
          )}
          {Object.keys(assets).length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>Material descargable</Typography>
              <AssetShowcase assets={assets} thumbnails withDownload />
            </Box>
          )}
        </>
      </Box>
    </Box>
  );
};