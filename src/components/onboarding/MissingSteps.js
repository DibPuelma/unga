import { Close } from "@mui/icons-material";
import { Card, IconButton, Stack, Typography } from "@mui/material";
import { useContext, useState } from "react";
import Link from "src/Link";
import { UserContext } from "src/context/UserContext";

export default function MissingSteps({ institutionId, studentsCount, objectivesCount }) {
  const { user: { finishedTour } } = useContext(UserContext);
  const [showSteps, setShowSteps] = useState(studentsCount === 0 || objectivesCount === 0);
  if (!showSteps || !finishedTour) return null;

  return (
    <Card sx={{ p: 2 }}>
      <Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">Termina las configuraciones</Typography>
          <IconButton onClick={() => setShowSteps(false)}>
            <Close color="error" />
          </IconButton>
        </Stack>
        <Stack>
          <Typography
            variant="caption"
            sx={{ textDecoration: 'line-through' }}
          >
            1.- Nombre institución
          </Typography>
          <Typography
            variant="caption"
            sx={{ textDecoration: 'line-through' }}
          >
            2.- Agregar salas
          </Typography>
          {studentsCount > 0 ? (
            <Typography
              variant="caption"
              sx={{ textDecoration: 'line-through' }}
            >
              3.- Agregar párvulos
            </Typography>
          ) : (
            <Link href={`/institutions/${institutionId}/configuration?tab=5`}>
              <Typography variant="caption">
                3.- Agregar párvulos
              </Typography>
            </Link>
          )}
          {objectivesCount > 0 ? (
            <Typography
              variant="caption"
              sx={{ textDecoration: 'line-through' }}
            >
              4.- Agregar indicadores
            </Typography>
          ) : (
            <Link href={`/institutions/${institutionId}/configuration?tab=3`}>
              <Typography variant="caption">
                4.- Agregar indicadores
              </Typography>
            </Link>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}