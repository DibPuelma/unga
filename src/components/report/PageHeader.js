import { Box, Stack } from "@mui/material";

export default function PageHeader() {
  const orange = '#fb9f71';
  const lightBlue = '#a0c1d7';
  const pink = '#dd7792';
  const green = '#95c294';

  return (
    <Stack direction="row" height={30}>
      <Box flex={6} sx={{ backgroundColor: orange }}/>
      <Box flex={4} sx={{ backgroundColor: lightBlue }}/>
      <Box flex={3} sx={{ backgroundColor: pink }}/>
      <Box flex={4} sx={{ backgroundColor: green }}/>
    </Stack>
  )
}