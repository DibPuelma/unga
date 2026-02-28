import { Button, Stack, Typography } from "@mui/material";
import { signOut } from "next-auth/react";
import { useContext } from "react";
import { UserContext } from "src/context/UserContext";

export default function NotAuthorized() {
  const { clearContext } = useContext(UserContext);

  const handleLogout = (e) => {
    clearContext();
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: '90vh', width: '100%'}} spacing={2}>
      <Typography variant="h6">No tienes ninguna sala asignada</Typography>
      <Typography>Debes tener al menos una sala para poder usar Unga</Typography>
      <Button variant="contained" onClick={handleLogout}>Cerrar sesión</Button>
    </Stack>
  )
}