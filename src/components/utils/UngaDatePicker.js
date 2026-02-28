import { TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";

export default function UngaDatePicker({
  label = 'Selecciona la fecha',
  fullWidth = true,
  value,
  onChange,
  onError,
  maxDate,
  minDate,
  errorText,
  size,
}) {

  const handleChange = (newValue) => {
    if (onError) {
      if (!newValue.isValid()) {
        onError('Formato de fecha inválido');
      } else {
        onError('');
      }
    }
    onChange(newValue);
  };

  return (
    <DatePicker
      renderInput={(props) => (
        <TextField
          {...props}
          fullWidth={fullWidth}
          error={Boolean(errorText)}
          helperText={errorText}
          size={size}
        />
      )}
      inputFormat="DD/MM/YYYY"
      mask="__/__/____"
      label={label}
      showToolbar={false}
      okText="Aceptar"
      cancelText="Cancelar"
      maxDate={maxDate}
      value={value}
      onAccept={handleChange}
      onChange={() => {}}
      minDate={minDate}
    />
  )
}