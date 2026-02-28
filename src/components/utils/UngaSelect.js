import { Add } from "@mui/icons-material";
import { Box, Checkbox, Chip, Divider, FormControl, InputLabel, ListItemIcon, ListItemText, MenuItem, OutlinedInput, Select } from "@mui/material";
import { SCOPES_FOR_CORE } from "src/helpers/businessLogic";
import ErrorText from "./ErrorText";

const getLabelDecoration = (opt, separator = '') => {
  if (SCOPES_FOR_CORE[opt.name]) {
    return `${separator}${SCOPES_FOR_CORE[opt.name]}`;
  } else if (opt.level && !opt.level.name.toLocaleLowerCase().includes(opt.name.toLocaleLowerCase())) {
    return `${separator}${opt.level.name}`;
  }
  return '';
}

export default function UngaSelect({
  fullWidth,
  error,
  label,
  labelId,
  name,
  id,
  multiple,
  value,
  onChange,
  options,
  errorText,
  sx,
  noSelectionValue,
  maxWidth = 500,
  size = "small",
  onCreateNew,
  renderValue = (selected) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, overflowX: 'scroll' }}>
      {options.filter((opt) => selected.includes(opt.id)).map((opt) => (
        <Chip
          key={opt.name}
          label={`${opt.name} ${getLabelDecoration(opt, ' / ')}`}
          color="info"
        />
      ))}
    </Box>
  ),
  mapFunction = (object) => {
    const { name, id } = object;
    return (
      <MenuItem key={id} value={id} sx={{ wordBreak: 'break-all', whiteSpace: 'unset', maxWidth }}>
        {multiple && <Checkbox checked={value.includes(id)} size="small" sx={{ py: 0.5, pl: 0, pr: 1 }} />}
        <ListItemText primary={name} secondary={getLabelDecoration(object)} />
      </MenuItem>
    );
  },
  disabled = false,
}) {
  if (options.length === 0 && !onCreateNew) return null;

  return (
    <FormControl sx={sx} fullWidth={fullWidth} error={error} size="small" disabled={disabled}>
      <InputLabel id={id}>{label}</InputLabel>
      <Select
        size={size}
        labelId={labelId}
        name={name}
        id={id}
        multiple={multiple}
        value={value}
        onChange={onChange}
        input={<OutlinedInput id="select-multiple-chip" label={label} />}
        renderValue={renderValue}
      >
        {Boolean(onCreateNew) && (
          [
            <MenuItem key='add_new' onClick={onCreateNew} sx={{ mb: 1 }}>
              <ListItemIcon>
                <Add color="primary" />
              </ListItemIcon>
              <ListItemText primary="Crear nuevo" sx={{ color: (theme) => theme.palette.primary.main }} />
            </MenuItem>,
            <Divider key="divider" />
          ]
        )}
        {noSelectionValue}
        {options.map(mapFunction)}
      </Select>
      {error && (
        <ErrorText text={errorText} />
      )}
    </FormControl>
  )
}