import prisma from './prisma';

export const getOrCreateReportsOption = async (studentId, classroomId) => {
  let reportOption = await prisma.reportsOptions.findUnique({
    where: {
      studentId_classroomId: {
        studentId,
        classroomId,
      },
    },
    include: {
      Reports: true,
      Students: true,
      Classes: true,
    },
  });

  if (!reportOption) {
    reportOption = await prisma.reportsOptions.create({
      data: {
        studentId,
        classroomId,
        Reports: {
          create: {
            studentId,
            classroomId,
            institutionId: (await prisma.classes.findUnique({
              where: { id: classroomId },
              select: { institutionId: true },
            }))?.institutionId || '',
            teacherId: (await prisma.classes.findUnique({
              where: { id: classroomId },
              include: { users: true },
            }))?.mainTeacherId || '',
          },
        },
      },
      include: {
        Reports: true,
        Students: true,
        Classes: true,
      },
    });
  }

  return reportOption;
}

export const updateReportsOption = async (reportId, { extraObjectives, hideObjectives }) => {
  const reportOption = await prisma.reportsOptions.findFirst({
    where: { reportId },
  });

  if (!reportOption) throw new Error('ReportsOption not found');

  const currentExtra = reportOption.extraObjectives || [];
  const currentHidden = reportOption.hiddenObjectives || [];

  let newExtra = [...currentExtra];
  let newHidden = [...currentHidden];

  if (extraObjectives) {
    extraObjectives.forEach((objId) => {
      if (!newExtra.includes(objId)) {
        newExtra.push(objId);
      }
      // Remove from hidden if it was there
      newHidden = newHidden.filter((id) => id !== objId);
    });
  }

  if (hideObjectives) {
    hideObjectives.forEach((objId) => {
      if (!newHidden.includes(objId)) {
        newHidden.push(objId);
      }
      // Remove from extra if it was there
      newExtra = newExtra.filter((id) => id !== objId);
    });
  }

  const updated = await prisma.reportsOptions.update({
    where: { id: reportOption.id },
    data: {
      extraObjectives: [...new Set(newExtra)],
      hiddenObjectives: [...new Set(newHidden)],
    },
    include: {
      Reports: true,
      Students: true,
      Classes: true,
    },
  });

  return updated;
}
