import React, { useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getEvaluationsByInstitution } from '/db/evaluation';
import { getCores, getAllCoresWithAdvancement } from '/db/core';
import { getLevelsOfAchievement } from '/db/levelsOfAchievement';
import DefaultDict from '/src/helpers/dataStructures/DefaultDict';
import { getObservationsByInstitution } from '/db/observation';
import { getClassesByInstitution } from '/db/class';
import LevelOfAchievementDistribution from '/src/components/charts/LevelOfAchievementDistribution';
import { Check, KeyboardArrowUp, InsertCommentOutlined } from '@mui/icons-material';
import AdvancementSummary from '/src/components/dashboard/AdvancementSummary';
import { MixpanelContext } from 'services/MixpanelContext';
import { isAuthorized } from 'services/Authorization';
import { getInstitution } from 'db/institution';
import Head from 'next/head';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const authorizationResult = await isAuthorized(context);
  if (!authorizationResult) {
    return {
      redirect: {
        permanent: false,
        destination: '/auth/login'
      }
    };
  }
  const [isAuthorizedValue, returnValue] = authorizationResult;
  if (!isAuthorizedValue) {
    return returnValue || {
      redirect: {
        permanent: false,
        destination: '/'
      }
    };
  }

  const { params: { institutionId } } = context;
  const session = await getServerSession(context.req, context.res, authOptions);
  
  const classrooms = await getClassesByInstitution(institutionId);
  const institution = await getInstitution(institutionId);

  if (!institution) {
    return {
      notFound: true,
    };
  }

  if (institution.qualitativeOnly) {
    return {
      props: serializeForNextProps({
        classrooms,
        institution,
      })
    }
  }

  const observations = await getObservationsByInstitution(institutionId);
  const evaluations = await getEvaluationsByInstitution(institutionId);
  const levelsOfAchievement = await getLevelsOfAchievement(institutionId);
  const allCores = await getCores(institutionId);
  const cores = allCores.filter((core) => !core.hide);

  const totalData = new DefaultDict(Number);
  const classroomsData = new DefaultDict(Number);
  const coresData = new DefaultDict(Number);
  const studentObjectivesChecked = {};

  evaluations.forEach((evaluation) => {
    const {
      objectiveId,
      studentId,
      levelOfAchievement,
      class: classroom,
      core,
    } = evaluation;
    
    if (!levelOfAchievement || !classroom || !core) return;
    
    const levelOfAchievementName = levelOfAchievement.name;
    const value = levelOfAchievement.value;
    const className = classroom.name;
    const coreName = core.name;
    
    if (studentObjectivesChecked[`${studentId},${objectiveId}`]) return;
    studentObjectivesChecked[`${studentId},${objectiveId}`] = true;
    totalData[levelOfAchievementName] += 1;
    totalData.sum += value;
    totalData.totalEvaluations += 1;
    classroomsData[`${className}.${levelOfAchievementName}`] += 1;
    classroomsData[`${className}.sum`] += value;
    classroomsData[`${className}.totalEvaluations`] += 1;
    coresData[`${coreName}.${levelOfAchievementName}`] += 1;
    coresData[`${coreName}.sum`] += value;
    coresData[`${coreName}.totalEvaluations`] += 1;
  })

  const possibleLevelsOfAchievement = levelsOfAchievement.length - 1;
  if (totalData.totalEvaluations > 0 && possibleLevelsOfAchievement > 0) {
    totalData.performance = (totalData.sum / totalData.totalEvaluations) / possibleLevelsOfAchievement;
  } else {
    totalData.performance = 0;
  }

  for (const classroom of classrooms) {
    const { name: className } = classroom;
    const classAdvancementByCore = await getAllCoresWithAdvancement(institutionId, classroom.id)
    classroomsData[`${className}.performance`] = classroomsData[`${className}.totalEvaluations`] > 0 && possibleLevelsOfAchievement > 0
      ? (classroomsData[`${className}.sum`] / classroomsData[`${className}.totalEvaluations`]) / possibleLevelsOfAchievement
      : 0;
    let classPossibleEvaluations = 0;
    classAdvancementByCore.forEach((core) => {
      const { possibleEvaluations, name: coreName } = core;
      classPossibleEvaluations += possibleEvaluations;
      coresData[`${coreName}.possibleEvaluations`] += possibleEvaluations;
    })
    classroomsData[`${className}.No observado`] = classPossibleEvaluations - classroomsData[`${className}.totalEvaluations`];
    classroomsData[`${className}.progress`] = classPossibleEvaluations > 0
      ? 1 - (classroomsData[`${className}.No observado`] / classPossibleEvaluations)
      : 0;
    totalData['No observado'] += classroomsData[`${className}.No observado`];
    totalData.possibleEvaluations += classPossibleEvaluations;
  }

  cores.forEach((core) => {
    const { name } = core;
    coresData[`${name}.performance`] = coresData[`${name}.totalEvaluations`] > 0 && possibleLevelsOfAchievement > 0
      ? (coresData[`${name}.sum`] / coresData[`${name}.totalEvaluations`]) / possibleLevelsOfAchievement
      : 0;
    coresData[`${name}.No observado`] = coresData[`${name}.possibleEvaluations`] - coresData[`${name}.totalEvaluations`]
    coresData[`${name}.progress`] = coresData[`${name}.possibleEvaluations`] > 0
      ? 1 - (coresData[`${name}.No observado`] / coresData[`${name}.possibleEvaluations`])
      : 0;
  });

  observations.forEach((observation) => {
    const { class: classroom, core } = observation;
    const className = classroom?.name;
    const coreName = core?.name;
    totalData.observations += 1;
    if (className) classroomsData[`${className}.observations`] += 1;
    if (coreName) coresData[`${coreName}.observations`] += 1;
  })

  totalData['progress'] = totalData.possibleEvaluations > 0
    ? 1 - (totalData['No observado'] / totalData.possibleEvaluations)
    : 0;

  return {
    props: serializeForNextProps({
      totalData,
      classroomsData,
      coresData,
      classrooms,
      levelsOfAchievement,
      institution,
      cores,
    }),
  }
}

export default function Index({
  totalData = {},
  classroomsData = {},
  coresData = {},
  cores = [],
  classrooms = [],
  levelsOfAchievement = [],
  institution,
}) {
  const { trackInstitutionPageView } = useContext(MixpanelContext);

  useEffect(() => {
    if (trackInstitutionPageView && institution?.name) {
      try {
        // trackInstitutionPageView(institution.name);
      } catch (error) {
        console.error('Error tracking institution page view:', error);
      }
    }
  }, [trackInstitutionPageView, institution?.name])

  // Handle missing institution
  if (!institution) {
    return (
      <>
        <Head><title>Institution not found</title></Head>
        <Typography variant="h5">Institution not found</Typography>
      </>
    );
  }

  // Handle qualitative-only institutions
  if (institution.qualitativeOnly) {
    return (
      <>
        <Head><title>{institution.name}</title></Head>
        <Box mb={8}>
          <Typography variant="h5" mb={4}>Salas</Typography>
          {classrooms.map((classroom) => (
            <Typography key={classroom.id} variant="body1" mb={2}>
              {classroom.name}
            </Typography>
          ))}
        </Box>
      </>
    );
  }

  const totalDataAchievementDistribution = {};

  levelsOfAchievement.sort((a, b) => b.value - a.value).forEach((loa) => {
    totalDataAchievementDistribution[loa.name] = {
      quantity: totalData[loa.name] || 0,
      achievementValue: loa.value,
    }
  });

  return (
    <>
      <Head><title>{institution.name}</title></Head>
      <Box mb={8}>
        <Grid container direction="row" mb={4} spacing={{ xs: 1, md: 2 }}>
          <Grid item xs={4} sm={3} md={2} >
            <Paper sx={{ py: 1, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Stack direction="row" alignItems="center">
                <Check color="primary" />
                <Typography variant="h4" ml={1}>{(totalData.progress * 100).toFixed(0)}%</Typography>
              </Stack>
              <Typography variant="body2">Progreso</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4} sm={3} md={2} >
            <Paper sx={{ py: 1, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Stack direction="row" alignItems="center">
                <KeyboardArrowUp color="primary" />
                <Typography variant="h4" ml={1}>{(totalData.performance * 100).toFixed(0)}%</Typography>
              </Stack>
              <Typography variant="body2">Desempeño</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4} sm={3} md={2} >
            <Paper sx={{ py: 1, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Stack direction="row" alignItems="center">
                <InsertCommentOutlined color="primary" fontSize="small" />
                <Typography variant="h4" ml={1}>{totalData.observations || 0}</Typography>
              </Stack>
              <Typography variant="body2">Observaciones</Typography>
            </Paper>
          </Grid>
        </Grid>
        <div style={{ height: '5em' }}>
          <LevelOfAchievementDistribution levelsOfAchievementDistribution={totalDataAchievementDistribution} />
        </div>
      </Box>
      <Box mb={8}>
        <Typography variant="h5" mb={4}>Salas</Typography>
        {classrooms.map((classroom) => {
          const classAchievementDistribution = {};
          const { name, id: classroomId } = classroom;
          levelsOfAchievement.sort((a, b) => b.value - a.value).forEach((loa) => {
            classAchievementDistribution[loa.name] = {
              quantity: classroomsData[`${name}.${loa.name}`] || 0,
              achievementValue: loa.value,
            }
          });

          return (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={1}
              key={classroomId}
            >
              <AdvancementSummary
                key={name}
                name={name}
                achievementDistribution={classAchievementDistribution}
                progress={classroomsData[`${name}.progress`]}
                performance={classroomsData[`${name}.performance`]}
                observations={classroomsData[`${name}.observations`]}
              />
            </Stack>
          )
        })}
      </Box>
      <Box mb={8}>
        <Typography variant="h5" mb={4}>Núcleos</Typography>
        {cores.sort((a, b) => b.position - a.position).map((core) => {
          const { name } = core;
          const coresAchievementDistribution = {};
          levelsOfAchievement.sort((a, b) => b.value - a.value).forEach((loa) => {
            coresAchievementDistribution[loa.name] = {
              quantity: coresData[`${name}.${loa.name}`] || 0,
              achievementValue: loa.value,
            }
          });
          return (
            <AdvancementSummary
              key={name}
              name={name}
              achievementDistribution={coresAchievementDistribution}
              progress={coresData[`${name}.progress`]}
              performance={coresData[`${name}.performance`]}
              observations={coresData[`${name}.observations`]}
            />
          )
        })}
      </Box>
    </>
  );
}

Index.auth = true