import { Box, Divider, Stack, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { AdvancedReportContext } from "src/context/AdvancedReportContext";

export default function Signature({ signer, isCurrentUser, parent, noSignerText }) {
  const { printing } = useContext(AdvancedReportContext);
  const normalizedSigner = useMemo(() => ({ ...signer, ...signer?.data }), [signer]);

  const role = {
    principal: 'Directora',
    teacher: 'Educadora',
    coordinator: 'Coordinadora académica'
  }

  const getSignature = () => {
    if (!normalizedSigner.signature) {
      if (!signer || parent || printing) return null;
      if (isCurrentUser) {
        return (
          <Typography textAlign="center">Agrega tu firma accediendo a tu perfil</Typography>
        );
      } else {
        return (<Typography textAlign="center">{normalizedSigner.firstName} puede agregar su firma en su perfil</Typography>);
      }
    } else {
      return (
        <Box sx={{
          position: 'relative',
          width: printing ? { xs: 75, sm: 100 } : { xs: 150, sm: 200 },
          height: printing ? { xs: 37, sm: 50 } : { xs: 75, sm: 100 },
        }}>
          <img
            src={normalizedSigner.signature.url}
            height="100%"
            width="100%"
          />
        </Box>
      );
    }
  }

  const getText = () => {
    if (!signer) {
      return (
        <Typography variant="caption" textAlign="center">{noSignerText}</Typography>
      )
    }
    return (
      <Stack>
        <Typography variant="caption" textAlign="center">
          {normalizedSigner.firstName} {normalizedSigner.lastName}
        </Typography>
        <Typography variant="caption" textAlign="center">
          {role[normalizedSigner.role]}
        </Typography>
      </Stack>
    )
  }


  return (
    <Stack alignItems="center">
      <Box height={{ xs: 50, sm: 75 }} alignItems="flex-end" display="flex">
        {getSignature()}
      </Box>
      <Divider
        flexItem
        sx={(theme) => ({
          mx: { xs: 0, sm: 4, md: 8 },
          my: 2,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
          backgroundColor: theme.palette.primary.main
        })}
      />
      {getText()}
    </Stack>
  )
}