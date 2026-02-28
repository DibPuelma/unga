import { useTheme } from "@emotion/react";
import { Typography } from "@mui/material";
import Link from "src/Link";

export default function TermsAndConditions() {
  const theme = useTheme();
  return (
    <Typography
      component="div"
      variant="caption"
      textAlign="center"
    >
      Al usar Unga aceptas nuestra <Link
        href="/privacy-policy"
        sx={{
          color: theme.palette.info.main,
          textDecorationColor: theme.palette.info.main,
        }}>politica de privacidad</Link>
      {' y nuestros '}<Link
        href="/terms-of-service"
        sx={{
          color: theme.palette.info.main,
          textDecorationColor: theme.palette.info.main,
        }}>términos y condiciones</Link>
    </Typography>
  )
}