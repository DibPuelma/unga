import { Container, Typography } from "@mui/material";
import { getFullActivity } from "db/activity";
import ActivityCard from "src/components/activity/ActivityCard";

export async function getServerSideProps(context) {
  const { params: { activityId } } = context;
  const activity = await getFullActivity(activityId);
  if (!activity?.publiclyAvailable) return {
    redirect: {
      permanent: false,
      destination: '/'
    }
  }

  return {
    props: {
      activity,
    }
  }
}

export default function Activity({ activity }) {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom mt={2}>
        Experiencia de aprendizaje Unga
      </Typography>
      <ActivityCard activity={activity} />
    </Container>
  )
}