import { LinearProgress } from "@mui/material";
import SendAddedPaymentMethodSlackMessage from "commands/slack/SendAddedPaymentMethodSlackMessage";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { MixpanelContext } from "services/MixpanelContext";
import PlansService from "services/PlansService";

export async function getServerSideProps(context) {
  const { user } = await getServerSession(context.req, context.res, authOptions);
  const { query: { newPlan } } = context;
  if (user.plan !== 'trial' || !newPlan) return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
  await PlansService.startFreeTrial(user, newPlan);
  new SendAddedPaymentMethodSlackMessage(user, newPlan).perform();

  return {
    props: {
      plan: newPlan,
    },
  };
}

export default function IndividualPlanSuscriptionSuccess({ plan }) {
  const router = useRouter();
  const { trackPurchasePlan } = useContext(MixpanelContext);
  useEffect(() => {
    // trackPurchasePlan(plan)
    router.replace('/');
  }, []);
  return <LinearProgress />
}