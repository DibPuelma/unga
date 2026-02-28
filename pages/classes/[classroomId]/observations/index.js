import React from 'react';
import { getFullObservationsByClass } from 'db/observation';
import ObservationsList from 'src/components/observations/ObservationsList';
import { getClassroom } from 'db/class';
import { Box, Stack } from '@mui/material';
import { isAuthorized } from 'services/Authorization';
import Head from 'next/head';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import CreateObservationButton from 'src/components/observations/CreateObservationButton';
import PlansService from 'services/PlansService';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.plansFromIndividualGrow);
  if (!isAuthorizedValue) return returnValue;

  const { params: { classroomId } } = context;

  const observations = await getFullObservationsByClass({ classroomId, pageSize: 100 });
  const classroom = await getClassroom(classroomId);

  return {
    props: serializeForNextProps({
      observations,
      classroom,
    })
  }
}

export default function ClassObservations({ observations, classroom }) {
  return (
    <Box>
      <Head><title>Observaciones {classroom.name}</title></Head>
      <Stack mb={{ xs: 2, sm: 1 }}>
        <TutorialLink id="87b39fe309364a9990fdb28a9cd9a881" />
      </Stack>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <CreateObservationButton classroomId={classroom.id} />
      </Stack>
      <ObservationsList
        printable
        columns={{ sm: 1, md: 2, xl: 3 }}
        observations={observations}
        emptyText="Aún no se registran observaciones en esta sala"
      />
    </Box>
  )
}