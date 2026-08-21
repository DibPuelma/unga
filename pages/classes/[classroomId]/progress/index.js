import React, { useContext, useEffect, useState } from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { getClassroom } from 'db/class';
import { getInstitutionWithStructure } from 'db/institution';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { isAuthorized } from 'services/Authorization';
import PlansService from 'services/PlansService';
import { UserContext } from 'src/context/UserContext';
import { serializeForNextProps } from 'src/helpers/businessLogic';
import { getClassroomProgress } from 'db/activityProgress';
import UngaCircularProgress from 'src/components/utils/UngaCircularProgress';
import UngaError from 'src/components/utils/UngaError';
import ProgressSummary from 'src/components/progress/ProgressSummary';
import CoreProgressList from 'src/components/progress/CoreProgressList';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.INSTITUTIONAL_ONLY);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);
  const { user, user: { institution: { id: institutionId } } } = session;
  const { params: { classroomId } } = context;

  const classroom = await getClassroom(classroomId);
  if (!classroom) {
    return {
      notFound: true,
    };
  }

  const institution = await getInstitutionWithStructure(institutionId);

  let progress = null;
  try {
    progress = await getClassroomProgress(classroomId, institution.cores || []);
  } catch (error) {
    console.error('Error fetching progress:', error);
    // Return default structure on error
    progress = {
      summary: {
        plannedToDate: 0,
        evaluatedToDate: 0,
        expectedToDate: 0,
        expectedFullYear: 0,
      },
      cores: (institution.cores || []).map(core => ({
        coreId: core.id,
        coreName: core.name,
        position: core.position,
        plannedCount: 0,
        evaluatedCount: 0,
      })),
    };
  }

  return {
    props: serializeForNextProps({
      user,
      institution,
      classroom,
      progress,
    }),
  };
}

export default function Progress({ user: propsUser, institution, classroom, progress: propsProgress }) {
  const { setSelectedClassroom } = useContext(UserContext);
  const [progress, setProgress] = useState(propsProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelectedClassroom(classroom);
  }, [classroom, setSelectedClassroom]);

  const refreshProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/classrooms/${classroom.id}/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      const data = await response.json();
      setProgress(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Always show UI, even if loading or no data
  // If progress exists but has no cores, use institution cores as fallback
  const displayProgress = progress || {
    summary: {
      plannedToDate: 0,
      evaluatedToDate: 0,
      expectedToDate: 0,
      expectedFullYear: 0,
    },
    cores: [],
  };

  // If cores array is empty but institution has cores, populate with zeros
  if (displayProgress.cores.length === 0 && institution?.cores && institution.cores.length > 0) {
    displayProgress.cores = institution.cores.map(core => ({
      coreId: core.id,
      coreName: core.name,
      position: core.position,
      plannedCount: 0,
      evaluatedCount: 0,
    })).sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  if (loading && !progress) {
    return <UngaCircularProgress />;
  }

  return (
    <>
      <Head>
        <title>Avance de actividades - {classroom.name}</title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Avance de actividades
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {classroom.name}
            </Typography>
          </Box>

          <ProgressSummary
            plannedToDate={displayProgress.summary.plannedToDate}
            evaluatedToDate={displayProgress.summary.evaluatedToDate}
            expectedToDate={displayProgress.summary.expectedToDate}
            expectedFullYear={displayProgress.summary.expectedFullYear}
          />

          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Avance por núcleo
            </Typography>
            <CoreProgressList
              cores={displayProgress.cores}
              classroomId={classroom.id}
            />
          </Box>
        </Stack>
      </Container>
    </>
  );
}

