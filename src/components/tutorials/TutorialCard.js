import { Paper, Stack, Typography } from "@mui/material";

export default function TutorialCard({ tutorial }) {
  const { data: { videoId, title } } = tutorial;
  return (
    <Paper sx={{ p: 4, height: '100%' }}>
      <Stack height="100%">
        <Stack mb={2}>
          <Typography variant="subtitle1" textAlign="center" gutterBottom>{title}</Typography>
        </Stack>
        <Stack borderRadius={2} overflow="hidden">
          <iframe
            src={`https://www.loom.com/embed/${videoId}`}
            sx={{ borderRadius: 1 }}
            frameBorder="0"
            allowFullScreen
          >
          </iframe>
        </Stack>
      </Stack>
    </Paper>
  )
}