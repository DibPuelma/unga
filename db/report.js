import prisma from './prisma';
import { parseObservationAssets } from './observation';
import { withParsedAssets } from './user';

export const getOrCreateStudentLastReport = async (student, classroom, userId) => {
  let report = await prisma.reports.findUnique({
    where: {
      studentId_classroomId: {
        studentId: student,
        classroomId: classroom,
      },
    },
    include: {
      Students: true,
      Classes: {
        include: {
          Levels: true,
          users: true,
        },
      },
      Institutions: true,
      users_Reports_teacherIdTousers: true,
      Observations: {
        include: {
          users: true,
        },
      },
    },
  });

  if (!report) {
    const classroomRecord = await prisma.classes.findUnique({
      where: { id: classroom },
      include: {
        Institutions: true,
        users: true,
      },
    });

    const reportInclude = {
      Students: true,
      Classes: {
        include: {
          Levels: true,
          users: true,
        },
      },
      Institutions: true,
      users_Reports_teacherIdTousers: true,
      Observations: {
        include: {
          users: true,
        },
      },
    };

    try {
      report = await prisma.reports.create({
        data: {
          studentId: student,
          classroomId: classroom,
          institutionId: classroomRecord.institutionId,
          teacherId: classroomRecord.mainTeacherId || userId,
          users_UpdatedBy: {
            connect: { id: userId },
          },
        },
        include: reportInclude,
      });
    } catch (e) {
      if (e.code === 'P2002') {
        report = await prisma.reports.findUnique({
          where: { studentId_classroomId: { studentId: student, classroomId: classroom } },
          include: reportInclude,
        });
      } else {
        throw e;
      }
    }
  }

  // Transform observationsByCore if it exists
  let observationsByCore = {};
  if (report.observationsByCore && typeof report.observationsByCore === 'object') {
    const coreIds = Object.keys(report.observationsByCore);
    for (const coreId of coreIds) {
      const observationIds = report.observationsByCore[coreId] || [];
      const observations = await prisma.observations.findMany({
        where: {
          id: { in: observationIds },
        },
        include: {
          users: true,
        },
      });
      observationsByCore[coreId] = observations.map((obs) => ({
        ...obs,
        assets: parseObservationAssets(obs.assets),
      }));
    }
  }

  return JSON.parse(JSON.stringify({
    ...report,
    classroom: {
      ...report.Classes,
      level: report.Classes.Levels,
      mainTeacher: withParsedAssets(report.Classes.users),
    },
    institution: report.Institutions,
    student: report.Students,
    observationsByCore,
  }));
}

export const updateReport = async (data) => {
  const {
    id,
    summary,
    descriptionByScope,
    generalCommentPosition,
    observationsByCore,
    teacher,
    download,
  } = data;

  const updateData = {
    summary,
    descriptionByScope: descriptionByScope || {},
    generalCommentPosition,
    observationsByCore: observationsByCore || {},
  };

  if (!download) {
    updateData.updatedAt = new Date();
  }

  // Handle updatedBy array
  const report = await prisma.reports.findUnique({
    where: { id },
    include: {
      users_UpdatedBy: true,
    },
  });

  const updatedByIds = [...new Set([...(report?.users_UpdatedBy?.map((u) => u.id) || []), teacher])];

  const updatedReport = await prisma.reports.update({
    where: { id },
    data: {
      ...updateData,
      users_UpdatedBy: {
        set: updatedByIds.map((id) => ({ id })),
      },
    },
    include: {
      Students: true,
      Classes: {
        include: {
          Levels: true,
          users: true,
        },
      },
      Institutions: true,
      users_Reports_teacherIdTousers: true,
    },
  });

  return updatedReport;
}
