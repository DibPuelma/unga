import { Email } from "@mui/icons-material";
import { Grid, Stack, Typography } from "@mui/material";
import Head from "next/head";
import Image from "next/image";
import { isAuthorized } from "services/Authorization";
import imageStyles from "src/styles/images.module.css";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  return {
    props: {},
  };
}

export default function Help() {
  return (
    <>
      <Head><title>¿Necesitas ayuda?</title></Head>
      <Grid container minHeight="80vh" pb={10} spacing={6} alignItems="center">
        <Grid item xs={12} display="flex" flexDirection="column" alignItems="center">
          <div style={{ borderRadius: 5 }}>
            <Image src="/esteban-profile.png" width={300} height={300} className={imageStyles.borderRadius} />
          </div>
          <Typography mt={1} mb={1} variant="h4">Esteban</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Email />
            <Typography variant="h6">esteban@ungapp.com</Typography>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}