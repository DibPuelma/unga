import { Typography } from "@mui/material";

export default function ErrorText({ text }) {
  return (
    <Typography color="error" variant="caption" ml={1} mt={0.5}>
      {text}
    </Typography>
  )
}