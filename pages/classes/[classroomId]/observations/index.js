import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { getFullObservationsByClass } from 'db/observation';
import ObservationsList from 'src/components/observations/ObservationsList';
import { getClassroom } from 'db/class';
import { Box, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { isAuthorized } from 'services/Authorization';
import Head from 'next/head';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import CreateObservationButton from 'src/components/observations/CreateObservationButton';
import PlansService from 'services/PlansService';
import { serializeForNextProps } from 'src/helpers/businessLogic';
import UngaDatePicker from 'src/components/utils/UngaDatePicker';

const MOMENT_FORMAT = 'YYYY-MM-DD';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.INSTITUTIONAL_ONLY);
  if (!isAuthorizedValue) return returnValue;

  const { params: { classroomId } } = context;

  const { data: observations, after } = await getFullObservationsByClass({ classroomId });
  const classroom = await getClassroom(classroomId);

  return {
    props: serializeForNextProps({
      observations,
      after,
      classroom,
    })
  }
}

export default function ClassObservations({ observations, after, classroom }) {
  const [items, setItems] = useState(observations);
  const [nextCursor, setNextCursor] = useState(after);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef();
  const stateRef = useRef();

  // Switching classrooms from the sidebar is a client-side navigation to the same
  // route component, so it doesn't remount — resync state from the new SSR props.
  useEffect(() => {
    setItems(observations);
    setNextCursor(after);
    setStartDate(null);
    setEndDate(null);
    setLoading(false);
  }, [classroom.id, observations, after]);

  const fetchObservations = async ({ after: afterCursor, startDate: sd, endDate: ed, reset }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (afterCursor) params.set('after', afterCursor);
      if (sd && ed) {
        params.set('startDate', sd.format(MOMENT_FORMAT));
        params.set('endDate', ed.format(MOMENT_FORMAT));
      }
      const response = await axios.get(`/api/classrooms/${classroom.id}/observations?${params.toString()}`);
      setItems((oldValue) => (reset ? response.data.data : [...oldValue, ...response.data.data]));
      setNextCursor(response.data.after);
    } finally {
      setLoading(false);
    }
  };

  stateRef.current = { nextCursor, loading, startDate, endDate };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      const current = stateRef.current;
      if (entry.isIntersecting && current.nextCursor && !current.loading) {
        fetchObservations({
          after: current.nextCursor,
          startDate: current.startDate,
          endDate: current.endDate,
          reset: false,
        });
      }
    }, {
      // Trigger before the sentinel reaches the bottom edge of the viewport: sitting at the
      // very end of the document, it would otherwise only ever touch that edge, which never
      // produces a non-empty intersection rect and so never fires.
      rootMargin: '400px',
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [classroom.id]);

  const handleLoadMore = () => {
    if (!nextCursor || loading) return;
    fetchObservations({ after: nextCursor, startDate, endDate, reset: false });
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    fetchObservations({ startDate: value, endDate, reset: true });
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    fetchObservations({ startDate, endDate: value, reset: true });
  };

  return (
    <Box>
      <Head><title>Observaciones {classroom.name}</title></Head>
      <Stack mb={{ xs: 2, sm: 1 }}>
        <TutorialLink id="87b39fe309364a9990fdb28a9cd9a881" />
      </Stack>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <CreateObservationButton classroomId={classroom.id} />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <UngaDatePicker
          label="Desde"
          value={startDate}
          onChange={handleStartDateChange}
          maxDate={endDate}
        />
        <UngaDatePicker
          label="Hasta"
          value={endDate}
          onChange={handleEndDateChange}
          minDate={startDate}
        />
      </Stack>
      <ObservationsList
        printable
        columns={{ sm: 1, md: 2, xl: 3 }}
        observations={items}
        emptyText="Aún no se registran observaciones en esta sala"
      />
      {nextCursor && (
        <Stack alignItems="center" mt={3}>
          <LoadingButton
            variant="outlined"
            color="primary"
            loading={loading}
            onClick={handleLoadMore}
          >
            Cargar más observaciones
          </LoadingButton>
        </Stack>
      )}
      {/* Sentinel needs a real height: a zero-area element can't produce an intersection. */}
      <Box ref={sentinelRef} height={1} mt={2} />
    </Box>
  )
}
