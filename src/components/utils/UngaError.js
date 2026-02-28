import { Box, Stack, Typography } from "@mui/material";

export default function UngaError({ text }) {
  return (
    <Stack minHeight="60vh" minWidth="40vh" display="flex" justifyContent="center" alignItems="center">
      <Typography color="error" textAlign="center">{text}</Typography>
      <Typography variant="caption" textAlign="center">Contactáte por whatsapp al +44 7543 814676</Typography>
    </Stack>
  )
}