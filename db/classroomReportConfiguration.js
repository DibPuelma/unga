import prisma from './prisma';
import moment from 'moment-timezone';

const getDefaultConfiguration = () => ({
  timePeriods: {
    diagnosis: { name: 'Diagnóstico', show: false, date: moment().format('YYYY-MM-DD') },
    firstSemester: { name: '1er Semestre', show: false, date: moment().format('YYYY-MM-DD') },
    secondSemester: { name: '2do Semestre', show: false, date: moment().format('YYYY-MM-DD') },
  },
  hideDate: false,
  showAttendance: false,
  showTeam: false,
  team: '',
  allowEvaluations: false,
});

const flattenConfig = (config) => {
  const defaults = getDefaultConfiguration();
  const stored = config.configuration || {};
  return {
    id: config.id,
    classroomId: config.classroomId,
    institutionId: config.institutionId,
    timePeriods: stored.timePeriods ?? defaults.timePeriods,
    hideDate: stored.hideDate ?? defaults.hideDate,
    showAttendance: stored.showAttendance ?? defaults.showAttendance,
    showTeam: stored.showTeam ?? defaults.showTeam,
    team: stored.team ?? defaults.team,
    allowEvaluations: stored.allowEvaluations ?? defaults.allowEvaluations,
  };
};

export const getOrCreateClassroomReportConfiguration = async (classroomId) => {
  let config = await prisma.classroomReportConfiguration.findUnique({
    where: { classroomId },
    include: {
      Classes: true,
      Institutions: true,
    },
  });

  if (!config) {
    const classroom = await prisma.classes.findUnique({
      where: { id: classroomId },
      include: { Institutions: true },
    });

    if (!classroom) throw new Error('Classroom not found');

    config = await prisma.classroomReportConfiguration.create({
      data: {
        classroomId,
        institutionId: classroom.institutionId,
        configuration: getDefaultConfiguration(),
      },
      include: {
        Classes: true,
        Institutions: true,
      },
    });
  }

  return flattenConfig(config);
}

export const updateClassroomReportConfiguration = async (classroomId, configuration) => {
  const config = await prisma.classroomReportConfiguration.update({
    where: { classroomId },
    data: { configuration },
    include: {
      Classes: true,
      Institutions: true,
    },
  });

  return flattenConfig(config);
}
