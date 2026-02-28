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
      <Typography variant="h6">No perteneces a ninguna institución</Typography>
      <Typography>Debes pertenecer a una para poder usar la plataforma</Typography>
      <Button variant="contained" onClick={handleLogout}>Cerrar sesión</Button>
    </Stack>
  )
}