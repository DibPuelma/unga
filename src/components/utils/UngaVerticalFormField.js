import { Stack, TextField, Typography } from "@mui/material"

export default function UngaVerticalFormField({ value, name, label, type, onChange }) {
  if (type === 'text') {
    return (
      <Stack>
        <Typography fontSize={14} gutterBottom>{label}</Typography>
        <TextField
          name={name}
          value={value}
          variant="outlined"
          size="small"
          onChange={onChange}
        />
      </Stack>
    )
  }
}