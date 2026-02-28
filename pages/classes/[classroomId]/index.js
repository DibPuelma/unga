import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import {
  AutoStoriesOutlined,
  EventAvailable,
  InsertEmoticon,
  LightbulbOutlined,
  LockOutlined,
  SettingsOutlined,
  Today,
  VisibilityOutlined,
} from "@mui/icons-material";
import { STATUS } from 'react-joyride';
import { getClassroom } from "db/class";
import Head from "next/head";
import { isAuthorized } from "services/Authorization";
import Link from "src/Link";
import { useContext, useEffect, useMemo } from "react";
import { UserContext } from "src/context/UserContext";
import { useRouter } from "next/router";
import UngaJoyride from "src/components/utils/UngaJoyride";
import { MixpanelContext } from "services/MixpanelContext";
import usePlanUpgradeWarning from "src/hooks/usePlanUpgradeWarning";
import usePlans from "src/hooks/usePlans";
import { serializeForNextProps } from "src/helpers/businessLogic";

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context);
  if (!isAuthorizedValue) return returnValue;

  const { params: { classroomId } } = context;
  const classroom = await getClassroom(classroomId)

  return {
    props: serializeForNextProps({
      classroom,
    }),
  };
}

export default function Classroom({ classroom }) {
  const router = useRouter();
  const {
    allPlans,
    plansFromIndividualGrow,
    plansFromIndividualStandOut,
  } = usePlans();
  const { trackOnboardingStep } = useContext(MixpanelContext);
  const institutionId = useMemo(() => classroom.institution.id, [classroom])
  const classroomId = useMemo(() => classroom.id, [classroom])
  const { setSelectedClassroom, user: { plan } } = useContext(UserContext);

  useEffect(() => {
    setSelectedClassroom(classroom);
  }, [classroom]);

  const steps = [
    {
      target: '#lesson-plan-link',
      content: 'Bienvenida a Unga, para partir, déjanos ayudarte a planificar tu primera experiencia de aprendizaje.',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;
    if (status === STATUS.FINISHED && type === 'tour:end') {
      // trackOnboardingStep('Classroom To Lesson Plan')
      router.push(`${window.location.pathname}/lesson-plan`);
    }
  }

  function PageLink ({ href, title, plansWithAccess, id, icon }) {
    const handleNeedsToUpgrade = usePlanUpgradeWarning();

    if (plansWithAccess.includes(plan)) {
      return (
        <Link noLinkStyle href={href} id={id}>
          <Paper sx={{ p: { xs: 2, sm: 6 } }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              {icon}
              <Typography variant="h6">{title}</Typography>
            </Stack>
          </Paper>
        </Link>
      )
    }
    return (
      <Paper sx={{ p: { xs: 2, sm: 6 }, cursor: 'pointer' }} onClick={handleNeedsToUpgrade}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <LockOutlined />
          <Typography variant="h6">{title}</Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <Box pt={4}>
      <UngaJoyride
        steps={steps}
        callback={handleJoyrideCallback}
        locale={{
          last: 'Siguiente',
        }}
      />
      <Head>
        <title>Sala {classroom.name}</title>
      </Head>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Link noLinkStyle href={`/institutions/${institutionId}/activities`}>
            <Paper sx={{ p: { xs: 2, sm: 6 } }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AutoStoriesOutlined />
                <Typography variant="h6">Biblioteca de experiencias</Typography>
              </Stack>
            </Paper>
          </Link>
        </Grid>
        <Grid item xs={12} sm={6}>
          <PageLink
            href={`${window.location.pathname}/lesson-plan`}
            title="Planificaciones"
            plansWithAccess={plansFromIndividualGrow}
            id="lesson-plan-link"
            icon={<Today />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PageLink
            href={`${window.location.pathname}/students`}
            title="Informes y párvulos"
            plansWithAccess={plansFromIndividualGrow}
            id="students-link"
            icon={<InsertEmoticon />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PageLink
            href={`${window.location.pathname}/cores`}
            title="Evaluaciones"
            plansWithAccess={plansFromIndividualGrow}
            id="cores-link"
            icon={<LightbulbOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PageLink
            href={`${window.location.pathname}/observations`}
            title="Observaciones"
            plansWithAccess={plansFromIndividualGrow}
            id="observations-link"
            icon={<VisibilityOutlined />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PageLink
            href={`${window.location.pathname}/attendance`}
            title="Asistencia"
            plansWithAccess={plansFromIndividualStandOut}
            id="attendance-link"
            icon={<EventAvailable />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PageLink
            href={`/institutions/${institutionId}/classrooms/${classroomId}/configure`}
            title="Configuraciones"
            plansWithAccess={allPlans}
            id="settings-link"
            icon={<SettingsOutlined />}
          />
        </Grid>
      </Grid>
    </Box>
  )
}