import { Button, Stack, Typography } from "@mui/material";
import { signOut } from "next-auth/react";
import { useContext } from "react";
import Link from "src/Link";
import { UserContext } from "src/context/UserContext";

export default function NotAuthorized() {
  const { clearContext } = useContext(UserContext);

  const handleLogout = (e) => {
    clearContext();
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ height: '90vh', width: '100%' }} spacing={2}>
      <Typography variant="h6" mb={1}>No tienes permiso para ingresar a la plataforma</Typography>
      <Typography>
        Comunícate por whatsapp al +44 7543 814676 haciendo click
        <Link href="https://wa.me/447543814676">
          {' aquí'}
        </Link>
      </Typography>
      <Button variant="contained" onClick={handleLogout}>Cerrar sesión</Button>
    </Stack>
  )
}