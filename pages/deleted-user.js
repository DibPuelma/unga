import { Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";

export default function NotAuthorized() {
  const router = useRouter();

  const goToLogin = (e) => {
    router.push('/auth/login');
  };

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: '90vh', width: '100%'}} spacing={2}>
      <Typography variant="h6">Cuenta eliminada con éxito</Typography>
      <Button variant="contained" onClick={goToLogin}>Volver al inicio</Button>
    </Stack>
  )
}