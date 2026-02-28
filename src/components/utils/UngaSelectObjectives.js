import { Add } from "@mui/icons-material";
import { Box, Checkbox, Chip, Divider, FormControl, InputLabel, ListItemIcon, ListItemText, ListSubheader, MenuItem, OutlinedInput, Select } from "@mui/material";
import { useMemo } from "react";
import { ascendingSort } from "src/helpers/arrays";
import ErrorText from "./ErrorText";

export default function UngaSelectObjectives({
  onCreateNew,
  fullWidth,
  error,
  label,
  labelId,
  name,
  id,
  multiple,
  value,
  emptyValue,
  noSelectionValue,
  onChange,
  errorText,
  sx,
  objectives,
  extraOption,
  filteredCores = [],
  filteredLevels = [],
  filteredCurricularObjectives = [],
  filteredObjectives = [],
  doNotShowCores = [],
  doNotShowLevels = [],
  menuMaxWidth = 10,
  allCores,
  renderValue = (selected) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, overflowX: 'scroll' }}>
      {objectives.filter((obj) => selected.includes(obj.id)).map((obj) => (
        <Chip key={obj.id} label={obj.name} color="info" />
      ))}
    </Box>
  ),
  objectivesByCoreAndLevel: propsObjectivesByCoreAndLevel = null,
}) {
  const handleChange = (e) => {
    const { target: { value } } = e;
    if (multiple && value.length > 0 && !value[0]) return;

    onChange(e);
  }

  const getObjectivesByCoreAndLevel = () => {
    const newObjectivesByCoreAndLevel = {};
    
    const checkAndPushObjective = (coreId, levelId, coreName, levelName, objective) => {
      // Filter by cores
      if (filteredCores.length > 0 && !filteredCores.includes(coreId)) {
        return;
      }
      
      // Filter by levels
      if (filteredLevels.length > 0 && !filteredLevels.includes(levelId)) {
        return;
      }
      
      // Filter by curricular objectives (for objectives)
      if (filteredCurricularObjectives.length > 0) {
        const curricularObjectiveId = objective.curricularObjective?.id;
        if (!curricularObjectiveId || !filteredCurricularObjectives.includes(curricularObjectiveId)) {
          return;
        }
      }
      
      // Filter by objectives (for sub-objectives only)
      // Only apply this filter if the item has an 'objective' property (meaning it's a sub-objective)
      if (filteredObjectives.length > 0 && objective.objective) {
        const objectiveId = objective.objective.id || objective.objective;
        if (!objectiveId || !filteredObjectives.includes(objectiveId)) {
          return;
        }
      }
      
      // Exclude cores
      if (doNotShowCores.length > 0 && doNotShowCores.includes(coreId)) {
        return;
      }
      
      // Exclude levels
      if (doNotShowLevels.length > 0 && doNotShowLevels.includes(levelId)) {
        return;
      }
      
      if (!newObjectivesByCoreAndLevel[coreName]) {
        newObjectivesByCoreAndLevel[coreName] = {}
      }
      if (!newObjectivesByCoreAndLevel[coreName][levelName]) {
        newObjectivesByCoreAndLevel[coreName][levelName] = []
      }
      if (newObjectivesByCoreAndLevel[coreName][levelName].find((obj) => obj.id === objective.id)) return;

      newObjectivesByCoreAndLevel[coreName][levelName].push(objective);
    }

    objectives.forEach((objective) => {
      // Handle objectives with levels array (most common case)
      if (objective.levels && objective.levels.length > 0) {
        let core = null;
        
        // Determine the core
        if (objective.core) {
          if (typeof objective.core === 'object' && objective.core.id) {
            core = objective.core;
          } else if (typeof objective.core === 'string') {
            core = allCores?.find((c) => c.name === objective.core || c.id === objective.core);
          }
        }
        
        if (!core) return;

        const { name: coreName, id: coreId } = core;

        // Process each level
        objective.levels.forEach((level) => {
          const levelId = level.id;
          const levelName = level.name;
          checkAndPushObjective(coreId, levelId, coreName, levelName, objective);
        });
      } 
      // Handle objectives with single level
      else if (objective.level) {
        const core = objective.core;
        if (!core) return;
        
        const coreName = typeof core === 'object' ? core.name : core;
        const coreId = typeof core === 'object' ? core.id : allCores?.find((c) => c.name === core || c.id === core)?.id;
        
        if (!coreId) return;
        
        const levelName = objective.level.name || objective.level;
        const levelId = typeof objective.level === 'object' ? objective.level.id : objective.level;
        
        checkAndPushObjective(coreId, levelId, coreName, levelName, objective);
      }
      // Handle objectives without levels (show under "Sin nivel asignado")
      else {
        let core = null;
        
        if (objective.core) {
          if (typeof objective.core === 'object' && objective.core.id) {
            core = objective.core;
          } else if (typeof objective.core === 'string') {
            core = allCores?.find((c) => c.name === objective.core || c.id === objective.core);
          }
        }
        
        if (!core) return;

        const { name: coreName, id: coreId } = core;
        const levelName = 'Sin nivel asignado';
        const levelId = 'no_level';
        checkAndPushObjective(coreId, levelId, coreName, levelName, objective);
      }
    });

    return newObjectivesByCoreAndLevel;
  }

  const objectivesByCoreAndLevel = useMemo(() => {
    if (propsObjectivesByCoreAndLevel) return propsObjectivesByCoreAndLevel;
    return getObjectivesByCoreAndLevel();
  }, [propsObjectivesByCoreAndLevel, objectives, filteredCores, filteredLevels, filteredCurricularObjectives, filteredObjectives, doNotShowCores, doNotShowLevels, allCores]);

  const getMenuItems = () => {
    const componentArray = [];
    if (onCreateNew) {
      componentArray.push(
        <MenuItem key='add_new' onClick={onCreateNew} sx={{ mb: 1 }}>
          <ListItemIcon>
            <Add color="primary" />
          </ListItemIcon>
          <ListItemText primary="Crear nuevo" sx={{ color: (theme) => theme.palette.primary.main }} />
        </MenuItem>
      )
      componentArray.push(<Divider key="divider" />)
    }
    Object.keys(objectivesByCoreAndLevel).forEach((coreName) => {
      Object.keys(objectivesByCoreAndLevel[coreName]).forEach((levelName) => {
        componentArray.push(
          <ListSubheader key={`${coreName}.${levelName}`} sx={{ lineHeight: '24px' }}>
            {coreName} - {levelName}
          </ListSubheader>
        );
        if (extraOption) componentArray.push(
          <MenuItem
            key={extraOption}
            value={extraOption}
            sx={{ wordBreak: 'break-all', whiteSpace: 'unset' }}
          >
            <Checkbox checked={value.includes(extraOption)} size="small" sx={{ py: 0.5, pl: 0, pr: 1 }} />
            <ListItemText primary={extraOption} />
          </MenuItem>
        )
        ascendingSort(objectivesByCoreAndLevel[coreName][levelName], 'position')
          .forEach(({ name, curricularObjective, objective, id }) => {
            let text = name;
            let curricularText = '';
            if (curricularObjective) {
              if (curricularObjective.type === 'transversal') {
                curricularText = ` (OAT ${curricularObjective.name.slice(0, 2)})`;
              } else if (curricularObjective.type === 'specific') {
                curricularText = ` (OA ${curricularObjective.name.slice(0, 2)})`;
              }
            }
            text += `${curricularText}`;
            componentArray.push(
              <MenuItem
                key={`${coreName}.${levelName}.${id}`}
                value={id}
                sx={{ wordBreak: 'break-all', whiteSpace: 'unset' }}
              >
                <Checkbox checked={value.includes(id)} size="small" sx={{ py: 0.5, pl: 0, pr: 1 }} />
                <ListItemText primary={text} />
              </MenuItem>
            )
          })
      })
    })
    return componentArray;
  }

  const empty = useMemo(() => Object.keys(objectivesByCoreAndLevel).length === 0, [objectivesByCoreAndLevel]);

  return (
    <FormControl sx={sx} fullWidth={fullWidth} error={error} size="small">
      <InputLabel id={id}>{label}</InputLabel>
      <Select
        labelId={labelId}
        name={name}
        id={id}
        multiple={multiple}
        value={value}
        onChange={handleChange}
        input={<OutlinedInput id={`select-multiple-${label}`} label={label} />}
        MenuProps={{ sx: { maxWidth: menuMaxWidth, maxHeight: 400 } }}
        renderValue={renderValue}
      >
        {noSelectionValue}
        {empty && emptyValue}
        {getMenuItems()}
      </Select>
      {error && (
        <ErrorText text={errorText} />
      )}
    </FormControl>
  )
}
