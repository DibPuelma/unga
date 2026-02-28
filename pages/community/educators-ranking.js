import { EmojiEventsOutlined, MilitaryTechOutlined } from "@mui/icons-material";
import { Card, Container, Stack, Typography } from "@mui/material";
import Head from "next/head";
import StatisticsService from "services/StatisticsService";
import Avatar from "src/components/user/Avatar";

export async function getServerSideProps() {
  const ranking = await StatisticsService.getEducatorsMonthlyRankingByMostSharedActivities();

  return {
    props: {
      ranking,
    }
  }
}

export default function EducatorsRanking({ ranking }) {

  const getBadge = (i) => {
    if (i === 0) return <EmojiEventsOutlined fontSize="large" />;
    if (i < 3) return <MilitaryTechOutlined />;
    return null;
  };

  return (
    <Container maxWidth="sm">
      <Head><title>Profesionales destacadas</title></Head>
      <Typography variant="h6" mb={2} textAlign="center">Educadoras con más experiencias utilizadas en el último mes</Typography>
      <Stack spacing={2}>
        {ranking.length > 0 ? ranking.map((educator, i) => {
          const backgroundColor = i === 0 ? 'info.light' : 'background.paper';
          const textColor = i === 0 ? 'white' : 'text.primary';
          return (
            <Card key={educator.id} sx={{ p: 2, backgroundColor, color: textColor }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography>{i + 1}</Typography>
                  <Avatar user={educator} />
                  <Stack>
                    <Typography>{educator.firstName} {educator.lastName.split(' ')[0]} </Typography>
                    <Typography variant="caption">{educator.activitiesShared} experiencias</Typography>
                  </Stack>
                </Stack>
                {getBadge(i)}
              </Stack>
            </Card>
          )
        }) : (
          <Typography variant="body2" textAlign="center">Todavía no hay educadoras cuyas experiencias hayan sido utilizadas por la comunidad este mes</Typography>
        )}
      </Stack>
    </Container>
  )
}