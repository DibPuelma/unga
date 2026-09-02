import { Box, Divider, Stack, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { AdvancedReportContext } from "src/context/AdvancedReportContext";

export default function Signature({ signer, isCurrentUser, parent, noSignerText }) {
  const { printing } = useContext(AdvancedReportContext);
  const normalizedSigner = useMemo(() => ({ ...signer, ...signer?.data }), [signer]);

  // The signature is a Cloudinary asset object, but it reaches this component as a raw JSON
  // string whenever the signer comes from a getter that skips withParsedAssets. Treat anything
  // we can't turn into a URL as "no signature" so we show the hint instead of a broken image.
  const signatureSrc = useMemo(() => {
    const signature = normalizedSigner.signature;
    if (!signature) return null;
    if (typeof signature === 'string') return signature.startsWith('http') ? signature : null;
    return signature.secure_url || signature.url || null;
  }, [normalizedSigner]);

  const role = {
    principal: 'Directora',
    teacher: 'Educadora',
    coordinator: 'Coordinadora académica'
  }

  const getSignature = () => {
    if (!signatureSrc) {
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
            src={signatureSrc}
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