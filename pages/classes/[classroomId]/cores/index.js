import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { getClassroom } from 'db/class';
import { getCoresWithLevelsOfAchievementByObjectiveAndSubObjective } from 'db/core';
import { getInstitution } from 'db/institution';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import Head from 'next/head';
import { useEffect, useState } from 'react';
import AdvancementCalculationService from 'services/AdvancementCalculationService';
import { isAuthorized } from 'services/Authorization';
import { getLevelsOfAchievement } from 'db/levelsOfAchievement';
import PlansService from 'services/PlansService';
import CoresAdvancementDetails from 'src/components/cores/CoresAdvancementDetails';
import CoresAdvancementSummary from 'src/components/cores/CoresAdvancementSummary';
import moment from 'moment-timezone';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import { useRouter } from 'next/router';
import { serializeForNextProps } from 'src/helpers/businessLogic';

export async function getServerSideProps(context) {
  const [isAuthorizedValue, returnValue] = await isAuthorized(context, PlansService.INSTITUTIONAL_ONLY);
  if (!isAuthorizedValue) return returnValue;

  const session = await getServerSession(context.req, context.res, authOptions);
  const {
    user: {
      institution: { id: institutionId },
    }
  } = session;
  const { params: { classroomId }, query: { endDate } } = context;

  let cores = null;
  const institution = await getInstitution(institutionId);
  const classroom = await getClassroom(classroomId);
  const startDateValue = moment().startOf('year').format('YYYY-MM-DD');
  const endDateValue = endDate ? moment(endDate).format('YYYY-MM-DD') : moment().add(1, 'day').format('YYYY-MM-DD');
  if (!institution.qualitativeOnly) {
    cores = await getCoresWithLevelsOfAchievementByObjectiveAndSubObjective(institutionId, classroomId, startDateValue, endDateValue);
    cores = cores.filter((core) => !core.hide);
    const levelsOfAchievement = await getLevelsOfAchievement(institutionId);
    cores = AdvancementCalculationService.addStudentsAdvancementToCores(cores, levelsOfAchievement);
  }

  return {
    props: serializeForNextProps({
      cores,
      classroom,
      institutionId,
      startDate: startDateValue,
      endDate: endDateValue,
    }),
  }
}


export default function Cores({ cores, classroom, institutionId, startDate: propsStartDate, endDate: propsEndDate }) {
  const router = useRouter();
  const [dynamicCores, setDynamicCores] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [endDate, setEndDate] = useState(moment(propsEndDate));
  const startDate = moment(propsStartDate);

  useEffect(() => {
    setDynamicCores(cores)
  }, [cores])


  const handleFilterDates = () => {
    router.push(`/classes/${classroom.id}/cores?endDate=${endDate.format('YYYY-MM-DD')}`)
  }

  return (
    <Box>
      <Head>
        <title>Avance {classroom.name}</title>
      </Head>
      <Stack direction="row" mt={2} mb={4} gap={2}>
        <DesktopDatePicker
          label="Fecha de término"
          inputFormat="DD-MM-yyyy"
          value={endDate}
          onChange={setEndDate}
          renderInput={(params) => (
            <TextField
              {...params}
              error={false}
              size="small"
              sx={{ width: { xs: '100%', sm: 250 } }}
            />
          )}
        />
        <Button variant="contained" color="secondary" onClick={handleFilterDates}>Filtrar</Button>
      </Stack>
      <Tabs
        value={tabValue}
        onChange={(event, newValue) => setTabValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab
          label="Resumen"
          value={0}
        />
        <Tab
          label="Detalle"
          value={1}
        />
      </Tabs>
      {tabValue === 0 && (
        <Box mt={2}>
          <CoresAdvancementSummary classroom={classroom} cores={dynamicCores} />
        </Box>
      )}
      {tabValue === 1 && (
        <Box mt={2}>
          <CoresAdvancementDetails classroom={classroom} institutionId={institutionId} startDate={startDate} />
        </Box>
      )}
    </Box>
  )
}