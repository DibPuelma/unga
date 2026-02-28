import prisma from './prisma';

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
        configuration: {},
      },
      include: {
        Classes: true,
        Institutions: true,
      },
    });
  }

  return config;
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

  return config;
}
