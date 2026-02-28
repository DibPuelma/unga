import { Search } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";

export default function Searchbar({ value, onChange, placeholder, fullWidth, sx }) {
  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      fullWidth={fullWidth}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
      }}
      value={value}
      onChange={onChange}
      sx={sx}
    />
  )
}