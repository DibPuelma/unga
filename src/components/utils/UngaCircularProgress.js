import { CircularProgress, Stack, Typography } from "@mui/material";

export default function UngaCircularProgress({
  height = window.innerHeight / 2,
  width = 'inherit',
  size = 40,
  text,
}) {
  return (
    <Stack
      width={width}
      height={height}
      alignItems="center"
      justifyContent="center"
    >
      <CircularProgress size={size} />
      {text && <Typography textAlign="center" mt={2}>{text}</Typography>}
    </Stack>
  )
}