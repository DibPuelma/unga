import React, { useEffect, useState, useContext } from 'react';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import {
  Typography,
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  Stack
} from '@mui/material';

import ExpandableObjectivesList from 'src/components/objectives/ExpandableObjectivesList';
import ObservationsList from 'src/components/observations/ObservationsList';

import styles from 'src/styles/noScrollbar.module.css';
import { getCoreWithLevelsOfAchievementByObjectiveAndSubObjective } from 'db/core';
import { getObservationsByClassAndCore } from 'db/observation';
import { MixpanelContext } from 'services/MixpanelContext';
import { getClassroom } from 'db/class';
import { isAuthorized } from 'services/Authorization';
import Head from 'next/head';
import { AutoGraph, VisibilityOutlined } from '@mui/icons-material';
import { UserContext } from 'src/context/UserContext';
import axios from 'axios';
import { ascendingSort } from 'src/helpers/arrays';
import TutorialLink from 'src/components/tutorials/TutorialLink';
import PlansService from 'services/PlansService';
import moment from 'moment-timezone';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.INSTITUTIONAL_ONLY);
  if (!isAuthorizedValue) return returnValue;


  const session = await getServerSession(context.req, context.res, authOptions);
  const { user: { institution } } = session;
  const institutionId = institution.id;
  const { params: { classroomId, coreId }, query: { startDate, endDate } } = context;

  const classroom = await getClassroom(classroomId);
  const startDateValue = startDate ? moment(startDate).format('YYYY-MM-DD') : moment().startOf('year').format('YYYY-MM-DD');
  const endDateValue = endDate ? moment(endDate).format('YYYY-MM-DD') : moment().add(1, 'day').format('YYYY-MM-DD');
  const core = await getCoreWithLevelsOfAchievementByObjectiveAndSubObjective(coreId, institutionId, classroomId, startDateValue, endDateValue);
  const observations = await getObservationsByClassAndCore(classroomId, coreId);

  return {
    props: serializeForNextProps({
      core,
      observations,
      classroom,
    }),
  };
}

export default function Core({ core, observations, classroom }) {
  const { setSelectedClassroom } = useContext(UserContext);
  const { trackCorePageView } = useContext(MixpanelContext);
  const [objectives, setObjectives] = useState([]);
  const [filteredObservations, setFilteredObservations] = useState(observations);
  const [selectedTab, setSelectedTab] = useState(0);

  const smUp = useMediaQuery(theme => theme.breakpoints.up('sm'))

  useEffect(() => {
    setSelectedClassroom(classroom);
    // trackCorePageView(core.name, classroom.name);
  }, []);

  useEffect(() => {
    // Sort objectives by position, preserving sub-objectives
    const newObjectives = [...core.objectives].sort((a, b) => {
      const aPos = a.position ?? 999999;
      const bPos = b.position ?? 999999;
      return aPos - bPos;
    });

    setObjectives(newObjectives);
  }, [core])

  const handleCreateObjective = async (objective) => {
    const objectiveId = objective.id;
    const objectivesWithDataResponse = await axios.get(`/api/classrooms/${classroom.id}/objectives/?ids=${objectiveId}`);
    setObjectives((oldValue) => [...oldValue, objectivesWithDataResponse.data[0]]);
  }

  const handleDragEnd = (newObjectives, type) => {
    setObjectives(newObjectives);
  }

  const handleTabChange = (_, newValue) => setSelectedTab(newValue);

  return (
    <>
      <Head><title>{core.name} {classroom.name}</title></Head>
      <Stack alignItems={{ xs: 'center', sm: 'flex-start' }} mb={1}>
        <TutorialLink id="cb1df65c95b44cbd862a48f7d5304ca9" />
      </Stack>
      <Typography variant="h5" textAlign={{ xs: 'center', sm: 'left' }} gutterBottom>
        {core.name}
      </Typography>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        aria-label="tabs para avance y observaciones"
        variant="scrollable"
      >
        <Tab
          label="Evaluación y resultados"
          icon={<AutoGraph />}
          iconPosition={smUp ? 'start' : 'top'}
        />
        <Tab
          label="Observaciones"
          icon={<VisibilityOutlined />}
          iconPosition={smUp ? 'start' : 'top'}
        />
      </Tabs>
      <Box pt={4} pb={8}>
        {selectedTab === 0 && (
          <Box
            sx={{ pb: 2, pr: 2 }}
            className={styles.noScrollbar}
          >
            <ExpandableObjectivesList
              withSubObjectives
              core={core}
              objectives={objectives}
              onCreate={handleCreateObjective}
              onDragEnd={handleDragEnd}
            />
          </Box>
        )}
        {selectedTab === 1 && (
          <ObservationsList
            printable
            observations={filteredObservations}
            columns={{ xs: 1, sm: 2, md: 3, xl: 4 }}
            emptyText="No hay observaciones para mostrar"
          />
        )}
      </Box>
    </>
  )
};