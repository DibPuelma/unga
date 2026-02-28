import { useMemo, Fragment } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { SCOPES_FOR_CORE } from "src/helpers/businessLogic";
import { toAcronym } from "src/helpers/strings";
import { uniqBy } from "lodash";

export default function ActivityCalendarPrintable({ activity, position, fontSizeMultiplier, fontSizes }) {
  const {
    name,
    cores = [],
    objectives = [],
    subObjectives = [],
    curricularObjectives = [],
    consequentialCurricularObjectives = [],
    ideaOrigin,
    ideaOriginDetails,
    description = '',
    familyParticipation,
    adultRole,
    materials = [],
  } = activity || {}

  const subObjectivesByCore = useMemo(() => {
    const result = {};
    if (!subObjectives || !Array.isArray(subObjectives)) return result;
    
    uniqBy(subObjectives, (subObjective) => subObjective.id).forEach((subObjective) => {
      if (!subObjective?.core?.id) return;
      const coreId = subObjective.core.id;
      const core = cores?.find((core) => core.id === coreId);
      if (!core) return;

      if (!result[core.name]) {
        result[core.name] = [];
      }
      result[core.name].push(subObjective.name)
    })
    return result;
  }, [subObjectives, cores])

  const objectivesByCore = useMemo(() => {
    const result = {};
    if (!objectives || !Array.isArray(objectives)) return result;
    
    uniqBy(objectives, (objective) => objective.id).forEach((objective) => {
      if (!objective?.core?.id) return;
      const coreId = objective.core.id;
      const core = cores?.find((core) => core.id === coreId);
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
    if (!curricularObjectives || !Array.isArray(curricularObjectives)) return result;
    
    curricularObjectives.forEach((curricularObjective) => {
      // Curricular objectives now have a coreId and Cores relation
      const coreId = curricularObjective.coreId || curricularObjective.Cores?.id;
      if (!coreId) return;
      
      const core = cores?.find((c) => c.id === coreId);
      if (!core) return;

      if (!result[core.name]) {
        result[core.name] = [];
      }
      result[core.name].push(curricularObjective.name);
    });
    return result;
  }, [curricularObjectives, cores])

  return (
    <Box mb={2}>
      <style>
        {`
         p {
          margin-top: 0;
         }
        `}
      </style>
      <Stack mb={0.5}>
        <Typography fontSize={fontSizes[10] * fontSizeMultiplier}>{position}. {name}</Typography>
      </Stack>
      <Box>
        <Stack spacing={1} mb={0.5}>
          {Object.keys(curricularObjectivesByCore).length > 0 && (
            <Box>
              <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Objetivos curriculares</Typography>
              {Object.entries(curricularObjectivesByCore).map(([core, curricularObjectives]) => (
                <Box key={core} mb={0.3}>
                  {curricularObjectives.map((curricularObjective) => (
                    <Typography key={curricularObjective} fontSize={fontSizes[6] * fontSizeMultiplier} component="div">
                      <b>{SCOPES_FOR_CORE[core]} ({toAcronym(core)})</b> {curricularObjective}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          )}
          {consequentialCurricularObjectives && consequentialCurricularObjectives.length > 0 && (
            <Box>
              <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Objetivos específicos</Typography>
              {consequentialCurricularObjectives.map((cco) => (
                <Typography key={cco.id} fontSize={fontSizes[6] * fontSizeMultiplier} component="div">
                  {cco.name}
                </Typography>
              ))}
            </Box>
          )}
          {(Object.keys(objectivesByCore).length > 0 || Object.keys(subObjectivesByCore).length > 0) && (
            <Box>
              <Stack direction="row" alignItems="center">
                <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Indicadores</Typography>
              </Stack>
              {Object.entries(objectivesByCore).map(([core, objectives]) => (
                <Fragment key={core}>
                  {objectives.map((objective) => (
                    <Typography key={objective} fontSize={fontSizes[6] * fontSizeMultiplier} component="div">
                      <b>{SCOPES_FOR_CORE[core]} ({toAcronym(core)})</b> {objective}
                    </Typography>
                  ))}
                </Fragment>
              ))}
              {Object.entries(subObjectivesByCore).map(([core, subObjectives]) => (
                <Fragment key={core}>
                  {subObjectives.map((subObjective) => (
                    <Typography key={subObjective} fontSize={fontSizes[6] * fontSizeMultiplier} component="div">
                      <b>{SCOPES_FOR_CORE[core]} ({toAcronym(core)})</b> {subObjective}
                    </Typography>
                  ))}
                </Fragment>
              ))}
            </Box>
          )}
          {ideaOrigin && (
            <Box>
              <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Origen de la idea</Typography>
              <Typography fontSize={fontSizes[8] * fontSizeMultiplier}>
                {ideaOrigin}{ideaOriginDetails ? `: ${ideaOriginDetails}` : ''}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Descripción</Typography>
            <Box
              fontSize={fontSizes[8] * fontSizeMultiplier}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </Box>
          <Stack mt={1}>
            {familyParticipation && (
              <Box>
                <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Participación de la familia</Typography>
                <Typography fontSize={fontSizes[8] * fontSizeMultiplier}>
                  {familyParticipation}
                </Typography>
              </Box>
            )}
            {adultRole && (
              <Box>
                <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Rol del adulto</Typography>
                <Typography fontSize={fontSizes[8] * fontSizeMultiplier}>
                  {adultRole}
                </Typography>
              </Box>
            )}
            {materials && materials.length > 0 && (
              <Box>
                <Typography fontSize={fontSizes[8] * fontSizeMultiplier} fontWeight="bold">Materiales</Typography>
                {materials.map((material, index) => (
                  <Stack key={material.id || material.name || index} direction="row" spacing={2} alignItems="center">
                    <Typography fontSize={fontSizes[6] * fontSizeMultiplier}>{material.name}</Typography>
                    <Typography fontSize={fontSizes[6] * fontSizeMultiplier} align="right">{material.quantityText}</Typography>
                  </Stack>
                ))}
              </Box>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};