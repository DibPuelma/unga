import { styled } from '@mui/material/styles';
import { Box, Container, LinearProgress, Stack, Toolbar, useMediaQuery } from '@mui/material';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import AppMenu from 'src/components/layout/AppMenu';
import { AdvancedReportContext } from 'src/context/AdvancedReportContext';
import { UserContext } from 'src/context/UserContext';
import { noClassroom, noInstitution, outsideApp } from 'src/helpers/businessLogic';

import AppBar from './AppBar';
import MissingSteps from '../onboarding/MissingSteps';

const noLayoutPaths = [
  '/privacy-policy',
  '/terms-of-service',
  '/no-classroom',
  '/no-institution',
  '/auth/register',
  '/auth/login',
  '/auth/verify',
  '/auth/forgot-password',
  '/payments/individual-plan-suscription-success',
];

const DRAWER_WIDTH = 300;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    paddingTop: theme.spacing(4),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${DRAWER_WIDTH}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

export default function Layout({ children }) {
  const router = useRouter();
  const session = useSession();
  const {
    userHasPlan,
    setUser: setContextUser,
    setInstitution: setContextInstitution,
    institution: contextInstitution,
    setTotalActivitiesCreated,
    totalActivitiesCreated,
  } = useContext(UserContext);
  const { printing } = useContext(AdvancedReportContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [objectivesCount, setObjectivesCount] = useState(0);
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  useEffect(() => {
    const getInstitution = async () => {
      if (session.status === 'loading') return;
      if (!session.data || outsideApp(session.data?.user)) {
        setLoading(false);
        return;
      }
      const { data: { user } } = session;

      setUser(user);
      setContextUser(user);

      if (noInstitution(user)) {
        setLoading(false);
        return;
      }

      if (user) {
        const institutionId = user.institution?.id || user.institutionId;
        if (!institutionId) {
          setLoading(false);
          return;
        }
        const institutionResponse = await axios.get(`/api/institutions/${institutionId}`);
        if (objectivesCount === 0) {
          const objectivesCountResponse = await axios.get(`/api/institutions/${institutionId}/objectives/count`);
          setObjectivesCount(objectivesCountResponse.data);
        }
        if (studentsCount === 0) {
          const studentsCountResponse = await axios.get(`/api/institutions/${institutionId}/students/count`);
          setStudentsCount(studentsCountResponse.data);
        }
        if (totalActivitiesCreated === 0) {
          const activitiesCountResponse = await axios.get(`/api/users/${user.id}/activities/count`);
          setTotalActivitiesCreated(activitiesCountResponse.data);
        }
        setInstitution(institutionResponse.data);
        setContextInstitution(institutionResponse.data);
      }

      setLoading(false);
    }
    getInstitution();
  }, [session])

  useEffect(() => contextInstitution && setInstitution(contextInstitution), [contextInstitution])

  const toggleDrawer = (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setOpen(!open);
  };

  if (loading) return <LinearProgress />;

  if (!user || noLayoutPaths.includes(router.pathname)) return (
    <Box
      component="main"
      maxWidth="100%"
      flexGrow={1}
    >
      <Container maxWidth="xl" sx={{ p: { xs: 2, xl: '16px 0 0 0' } }}>
        {children}
      </Container>
    </Box>
  )

  return (
    <Stack direction="row">
      {(institution || user.role === 'parent' || user.role === 'superAdmin') && (
        <AppBar drawerOpen={open} toggleDrawer={toggleDrawer} drawerWidth={DRAWER_WIDTH} />
      )}
      <AppMenu
        institution={institution}
        user={user}
        toggleDrawer={toggleDrawer}
        open={open}
        width={DRAWER_WIDTH}
        userHasPlan={userHasPlan}
      />
      {mdUp ? (
        <Main open={open}>
          <Box
            p={printing ? '0px !important' : '2rem 2rem 0'}
          >
            {children}
          </Box>
        </Main>
      ) : (
        <Container
          sx={{ p: printing ? '0px !important' : 2 }}
        >
          <Toolbar variant="dense" />
          {children}
        </Container>
      )
      }
      <Stack direction="row" justifyContent="flex-end" position="fixed" bottom={5} right={5}>
        {institution && userHasPlan && (
          <MissingSteps
            institutionId={institution.id}
            studentsCount={studentsCount}
            objectivesCount={objectivesCount}
          />
        )}
      </Stack>
    </Stack >
  )
}