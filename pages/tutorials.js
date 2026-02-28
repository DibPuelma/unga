import { Grid } from "@mui/material";
import { getTutorials } from "db/tutorials";
import Head from "next/head";
import TutorialCard from "src/components/tutorials/TutorialCard";

export async function getServerSideProps() {
  const tutorials = await getTutorials();
  return {
    props: {
      tutorials,
    },
  }
}

export default function Tutorials({ tutorials }) {
  return (
    <>
      <Head><title>Tutoriales</title></Head>
      <Grid container spacing={2}>
        {tutorials.map((tutorial) => (
        <Grid key={tutorial.id} item xs={12} sm={6} md={4}>
          <TutorialCard tutorial={tutorial} />
        </Grid>
        ))}
      </Grid>
    </>
  )
}