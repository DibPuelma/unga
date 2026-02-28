import { OndemandVideoOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import Link from "src/Link";

export default function TutorialLink({ id }) {
  return (
    <Link
      noLinkStyle
      href={`https://www.loom.com/share/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ mr: 0.5, display: 'block' }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <OndemandVideoOutlined color="primary" />
        <Typography variant="subtitle1" color="primary" textAlign="center">
          Video tutorial
        </Typography>
      </Stack>
    </Link>
  )
}