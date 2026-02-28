import { FormControl, InputLabel, MenuItem, OutlinedInput, Select } from "@mui/material";
import moment from "moment-timezone";
import ErrorText from "./ErrorText";

export default function SelectMonthNumberValue({
  errorText = 'No puede estar vacío',
  label = 'Selecciona un mes',
  name,
  onChange,
  value,
  multiple,
  fullWidth,
  error,
  sx,
}) {
  return (
    <FormControl sx={sx} fullWidth={fullWidth} error={error} size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        name={name}
        multiple={multiple}
        value={value}
        onChange={onChange}
        input={<OutlinedInput id="select-multiple-chip" label={label} />}
      >
        {moment.months().map((month, i) => (
          <MenuItem key={month} value={i}>
            {month[0].toLocaleUpperCase()}{month.slice(1)}
          </MenuItem>
        ))}
      </Select>
      {error && (
        <ErrorText text={errorText} />
      )}
    </FormControl>
  )
}