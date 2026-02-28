import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Grid, IconButton, Stack, Switch, Typography, useMediaQuery } from '@mui/material';
import { Add, Download, Remove } from '@mui/icons-material';
import { getClassroom } from 'db/class';
import { getPlannedActivitiesByClassroomAndDates } from 'db/plannedActivity';
import moment from 'moment-timezone';
import Head from 'next/head';
import { isAuthorized } from 'services/Authorization';
import { MixpanelContext } from 'services/MixpanelContext';
import { UserContext } from 'src/context/UserContext';
import { useReactToPrint } from 'react-to-print';
import { capitalize } from 'lodash';
import { enumerateWorkDaysBetweenDates } from 'src/helpers/dates';
import { arrayToListText } from 'src/helpers/arrays';
import { saveAs } from 'file-saver';
import PrintCalendarFull from 'src/components/lessonPlan/PrintCalendarFull';
import { getInstitution } from 'db/institution';
import axios from 'axios';
import LessonPlanService from 'services/LessonPlanService';
import ManagePlannedActivitiesButton from 'src/components/activity/ManagePlannedActivitiesButton';
import { serializeForNextProps } from 'src/helpers/businessLogic';


export async function getServerSideProps(context) {
  const lessonPlanService = new LessonPlanService(context);
  const {
    startDate,
    endDate,
    classroomId,
    institutionId,
    fontSizeMultiplier,
    uniqueFontSize,
    isPrinting,
  } = lessonPlanService.getParams();
  
  if (!isPrinting) {
    const [isAuthorizedValue, returnValue] = await isAuthorized(context);
    if (!isAuthorizedValue) return returnValue;
  }

  // Format dates to include full day range using ISO strings to preserve timezone
  const startOfWeek = moment(startDate).startOf('day').toISOString();
  const endOfWeek = moment(endDate).endOf('day').toISOString();

  const classroom = await getClassroom(classroomId);
  const institution = institutionId ? await getInstitution(institutionId) : null;
  const plannedActivities = await getPlannedActivitiesByClassroomAndDates(
    classroomId,
    startOfWeek,
    endOfWeek
  );

  return {
    props: serializeForNextProps({
      plannedActivities,
      startDate,
      endDate,
      classroom,
      isPrinting,
      institution,
      fontSizeMultiplier,
      uniqueFontSize,
    })
  }
}

const BASE_FONT_SIZES = {
  20: 20,
  18: 18,
  16: 16,
  14: 14,
  12: 12,
  10: 10,
  8: 8,
  6: 6,
}

const UNIQUE_FONT_SIZES = {
  20: 20,
  18: 12,
  16: 12,
  14: 12,
  12: 12,
  10: 12,
  8: 12,
  6: 12,
}

export default function PrintableLessonPlanFull({
  plannedActivities: propsPlannedActivities,
  startDate,
  endDate,
  classroom: {
    name: classroomName, level: { name: levelName }, mainTeacher, studentCount, allTeachers, id: classroomId
  },
  isPrinting,
  institution: propsInstitution,
  fontSizeMultiplier: propsFontSizeMultiplier,
  uniqueFontSize: propsUniqueFontSizes,
}) {
  const { institution: contextInstitution } = useContext(UserContext);
  const { trackPrintLessonPlanView, trackPrintLessonPlan } = useContext(MixpanelContext);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(propsFontSizeMultiplier || 1);
  const [plannedActivitiesPerDay, setPlannedActivitiesPerDay] = useState({});
  const [daysToPrint, setDaysToPrint] = useState([]);
  const [uniqueFontSize, setUniqueFontsize] = useState(propsUniqueFontSizes || false);
  const [fontSizes, setFontSizes] = useState(propsUniqueFontSizes ? UNIQUE_FONT_SIZES : BASE_FONT_SIZES);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const fixedButtonsRef = useRef();
  const calendarContainerStackRef = useRef();
  const otherTeachersNames = useMemo(() =>
    arrayToListText(allTeachers
      .filter((teacher) => teacher.id !== mainTeacher?.id)
      .map((teacher) => `${teacher.firstName} ${teacher.lastName}`)
    ),
    [allTeachers, mainTeacher]
  );
  const lessonPlanTitle = `${capitalize(moment(startDate).format('dddd DD [de] MMMM'))} ${daysToPrint.length > 1 ? ` al ${moment(endDate).format('dddd DD [de] MMMM')}` : ''}`;
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const institution = useMemo(() => contextInstitution || propsInstitution, [contextInstitution, propsInstitution]);

  useEffect(() => {
    distributeActivitiesPerDay(propsPlannedActivities)
  }, [propsPlannedActivities])

  const distributeActivitiesPerDay = (plannedActivities) => {
    const newPlannedActivitiesPerDay = {};
    const newWorkDays = enumerateWorkDaysBetweenDates(startDate, endDate, 'dddd DD');
    
    // Create a map of YYYY-MM-DD dates to workDay strings for easier lookup
    const dateToWorkDayMap = {};
    const dateMoment = moment(startDate).startOf('day');
    const endDateMoment = moment(endDate).startOf('day');
    
    while (dateMoment.isSameOrBefore(endDateMoment, 'day')) {
      const dayOfWeek = dateMoment.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        const dateStr = dateMoment.format('YYYY-MM-DD');
        const workDayStr = dateMoment.format('dddd DD');
        dateToWorkDayMap[dateStr] = workDayStr;
      }
      dateMoment.add(1, 'day');
    }
    
    // Initialize all workDays with empty arrays
    newWorkDays.forEach((workDay) => {
      newPlannedActivitiesPerDay[workDay] = [];
    });
    
    // Distribute activities by matching their dates
    plannedActivities?.forEach((pa) => {
      const plannedDateStr = moment(pa.plannedDate).startOf('day').format('YYYY-MM-DD');
      const workDay = dateToWorkDayMap[plannedDateStr];
      if (workDay && newPlannedActivitiesPerDay[workDay]) {
        newPlannedActivitiesPerDay[workDay].push(pa);
      }
    });
    
    setDaysToPrint(newWorkDays);
    setPlannedActivitiesPerDay(newPlannedActivitiesPerDay);
  }

  useEffect(() => {/* trackPrintLessonPlanView('full') */}, [])

  const increaseFontSize = () => {
    setFontSizeMultiplier((oldValue) => oldValue + 0.2);
  }

  const decreaseFontSize = () => {
    setFontSizeMultiplier((oldValue) => oldValue - 0.2);
  }

  const handleUniqueFontSize = ({ target: { checked } }) => {
    setUniqueFontsize(checked);
    if (checked) setFontSizes(UNIQUE_FONT_SIZES);
    else setFontSizes(BASE_FONT_SIZES);
  }

  const printDesktop = useReactToPrint({
    content: () => calendarContainerStackRef.current,
    documentTitle: `${lessonPlanTitle}.pdf`,
  });

  const printMobile = useReactToPrint({
    content: () => calendarContainerStackRef.current,
    documentTitle: `${lessonPlanTitle} calendario.pdf`,
    print: async (printIframe) => {
      try {
        const document = printIframe.contentDocument;
        if (document) {
          const html = document.getElementsByTagName('html')[0];
          const emptyStyleElements = html.querySelectorAll('style:empty[id]');
          // Remove the empty style elements from the container
          emptyStyleElements.forEach(styleElement => {
            styleElement.parentNode.removeChild(styleElement);
          });
          const response = await fetch(`/api/print/html`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              html: html.outerHTML,
            }),
          })
          const blob = await response.blob();
          saveAs(blob, `${lessonPlanTitle} calendario.pdf`);
        }
      } finally {
        setDownloadLoading(false);
      }
    }
  });

  const handlePrint = async () => {
    // trackPrintLessonPlan('full');
    if (mdUp) {
      printDesktop();
    } else {
      setDownloadLoading(true);
      printMobile();
    }
  }

  return (
    <Box>
      <style type="text/css" media="print">
        {`@page { size: letter landscape; margin: 0.5cm; }`}
      </style>
      <Head>
        <title>Planificación {classroomName} {moment(startDate).format('DD/MM')}</title>
      </Head>
      <>
        <Box ref={calendarContainerStackRef} pb={6}>
          <PrintCalendarFull
            institution={institution}
            classroomName={classroomName}
            levelName={levelName}
            studentCount={studentCount}
            lessonPlanTitle={lessonPlanTitle}
            mainTeacher={mainTeacher}
            otherTeachersNames={otherTeachersNames}
            daysToPrint={daysToPrint}
            plannedActivitiesPerDay={plannedActivitiesPerDay}
            fontSizes={fontSizes}
            fontSizeMultiplier={fontSizeMultiplier}
          />
        </Box>
        <Stack
          ref={fixedButtonsRef}
          maxWidth='95vw'
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.5, sm: 2 }}
          sx={{ position: 'fixed', bottom: 10, left: { xs: 10, sm: 'inherit' }, right: 10, display: isPrinting ? 'none' : 'flex' }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            pl={1}
            sx={{
              borderRadius: '4px',
              border: '1px solid rgba(228, 155, 112, 0.5)',
              backgroundColor: 'background.default'
            }}
          >
            <Typography
              variant="button"
              fontSize="0.875rem"
              fontWeight={500}
              sx={{ color: 'primary.main' }}
            >
              Homologar tamaño de letra
            </Typography>
            <Switch checked={uniqueFontSize} onChange={handleUniqueFontSize} />
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{
              borderRadius: '4px',
              border: '1px solid rgba(228, 155, 112, 0.5)',
              backgroundColor: 'background.default'
            }}
          >
            <IconButton
              onClick={decreaseFontSize}
              color="primary"
            >
              <Remove fontSize="small" />
            </IconButton>
            <Typography fontSize="0.875rem" fontWeight={500} sx={{ color: 'primary.main' }}>Tamaño de letra</Typography>
            <IconButton
              onClick={increaseFontSize}
              color="primary"
            >
              <Add fontSize="small" />
            </IconButton>
          </Stack>
          <ManagePlannedActivitiesButton
            plannedActivitiesPerDay={plannedActivitiesPerDay}
            onChange={setPlannedActivitiesPerDay}
            color="info"
          />
          <Button
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            variant="contained"
            onClick={handlePrint}
          >
            Imprimir o descargar planificación
          </Button>
          <Button
            sx={(theme) => ({
              display: { xs: 'inline-flex', sm: 'none' },
              backgroundColor: downloadLoading ? theme.palette.grey[400] : theme.palette.primary.main,
            })}
            variant="contained"
            onClick={downloadLoading ? () => { } : handlePrint}
            startIcon={!downloadLoading && <Download />}
            endIcon={downloadLoading && <CircularProgress color="info" size={16} />}
          >
            {downloadLoading ? 'Estamos generando el PDF' : 'Descargar'}
          </Button>
        </Stack>
      </>
    </Box>
  )
}