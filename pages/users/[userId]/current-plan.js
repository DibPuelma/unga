import { Box, Typography } from "@mui/material";
import Head from "next/head";
import { useContext } from "react";
import PlanSelect from "src/components/plan/PlanSelect";
import { UserContext } from "src/context/UserContext";

const planToSpanish = {
  individualStart: 'Inicia',
  individualGrow: 'Crece',
  individualStandOut: 'Destaca',
}

export default function CurrentPlan() {
  const { user } = useContext(UserContext);

  return (
    <>
      <Head><title>Tu plan</title></Head>
      <Box mt={4}>
        <Typography variant="h4" align="center" gutterBottom>Plan actual</Typography>
        <Typography variant="h2" align="center" mb={4}>{planToSpanish[user.plan]}</Typography>
        <PlanSelect />
      </Box>
    </>
  )
}