import prisma from './prisma';
import moment from 'moment-timezone';

export const createSubObjective = async ({ name, objective, institution, user }) => {
  const objectiveRecord = await prisma.objectives.findUnique({
    where: { id: objective },
    include: {
      Classes: {
        include: { Levels: true },
      },
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Cores: true,
      CurricularObjectives: true,
    },
  });

  if (!objectiveRecord) throw new Error('Objective not found');

  const levelIds = objectiveRecord.ObjectiveLevels?.map(ol => ol.Levels.id) || [];
  const classroomIds = objectiveRecord.Classes.map((c) => c.id);

  const subObjective = await prisma.subObjectives.create({
    data: {
      name,
      objectiveId: objective,
      coreId: objectiveRecord.coreId,
      institutionId: institution,
      createdById: user.id,
      curricularObjectiveId: objectiveRecord.curricularObjectiveId,
      Classes: {
        connect: classroomIds.map((id) => ({ id })),
      },
      Levels: {
        connect: levelIds.map((id) => ({ id })),
      },
    },
    include: {
      Cores: true,
      Levels: true,
      CurricularObjectives: true,
    },
  });

  return JSON.parse(JSON.stringify({
    ...subObjective,
    core: subObjective.Cores,
    levels: subObjective.Levels,
    curricularObjective: subObjective.CurricularObjectives,
  }));
}

export const softDeleteSubObjective = async (objectiveId) => {
  const subObjective = await prisma.subObjectives.update({
    where: { id: objectiveId },
    data: { deletedAt: new Date() },
  });

  return subObjective;
}

export const updateSubObjective = async (subObjectiveId, { name, position, objectiveId }) => {
  const updateData = {};
  
  if (name) updateData.name = name;
  if (position !== undefined) updateData.position = position;
  if (objectiveId) updateData.objectiveId = objectiveId;

  const subObjective = await prisma.subObjectives.update({
    where: { id: subObjectiveId },
    data: updateData,
    include: {
      Cores: true,
      Levels: true,
      CurricularObjectives: true,
    },
  });

  return JSON.parse(JSON.stringify({
    ...subObjective,
    core: subObjective.Cores,
    levels: subObjective.Levels,
    curricularObjective: subObjective.CurricularObjectives,
  }));
}

export const getSubObjectivesForInstitution = async (institutionId, withObjectives = true) => {
  const subObjectives = await prisma.subObjectives.findMany({
    where: {
      institutionId,
      deletedAt: null,
    },
    include: {
      Cores: true,
      Levels: true,
      Classes: true,
      Objectives: withObjectives,
      CurricularObjectives: {
        include: {
          Levels: true,
        },
      },
    },
  });

  return JSON.parse(JSON.stringify(subObjectives.map((subObj) => ({
    ...subObj,
    core: subObj.Cores,
    levels: subObj.Levels || [],
    curricularObjective: subObj.CurricularObjectives ? {
      ...subObj.CurricularObjectives,
      levels: subObj.CurricularObjectives.Levels || [],
    } : null,
    objective: subObj.Objectives,
    classrooms: subObj.Classes,
  }))));
}

export const getSubObjectivesWithAdvancement = async ({
  ids,
  classroomId,
  institutionId,
  startDate = moment().startOf('year').toISOString(),
  endDate = moment().endOf('day').toISOString(),
}) => {
  const students = await prisma.students.findMany({
    where: {
      classId: classroomId,
      deactivatedAt: null,
      deletedAt: null,
    },
  });

  const subObjectives = await prisma.subObjectives.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    include: {
      Cores: true,
      Objectives: {
        include: {
          ObjectiveLevels: {
            include: {
              Levels: true,
            },
          },
        },
      },
      SubObjectivesEvaluations: {
        where: {
          studentId: { in: students.map((s) => s.id) },
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          Students: true,
          LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const defaultLevel = await prisma.levelsOfAchievement.findFirst({
    where: {
      institutionId,
      value: 0,
    },
  });

  const transformed = subObjectives.map((subObj) => {
    const studentsLevelOfAchievement = students.map((student) => {
      const evaluation = subObj.SubObjectivesEvaluations.find((e) => e.studentId === student.id);
      return {
        student: {
          ...student,
          fullName: `${student.firstName} ${student.lastName}`,
        },
        levelOfAchievement: evaluation
          ? evaluation.LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement
          : defaultLevel || null,
      };
    });

    return {
      ...subObj,
      core: subObj.Cores,
      levels: subObj.Levels || subObj.Objectives?.ObjectiveLevels?.map(ol => ol.Levels) || [],
      studentsLevelOfAchievement,
    };
  });

  return JSON.parse(JSON.stringify(transformed));
}

export const removeClassroomFromSubObjectives = async (classroomId) => {
  const subObjectives = await prisma.subObjectives.findMany({
    where: {
      Classes: {
        some: { id: classroomId },
      },
    },
    include: {
      Classes: {
        include: { Levels: true },
      },
    },
  });

  await Promise.all(
    subObjectives.map(async (subObj) => {
      const remainingClassrooms = subObj.Classes.filter((c) => c.id !== classroomId);
      const remainingLevelIds = [...new Set(remainingClassrooms.map((c) => c.levelId))];

      await prisma.subObjectives.update({
        where: { id: subObj.id },
        data: {
          Classes: {
            set: remainingClassrooms.map((c) => ({ id: c.id })),
          },
          Levels: {
            set: remainingLevelIds.map((id) => ({ id })),
          },
        },
      });
    })
  );
}

export const removeClassroomFromSubObjectivesQuery = removeClassroomFromSubObjectives;

export const addClassroomToSubObjectivesByLevelAndInstitution = async (classroomId, levelId, institutionId) => {
  // Find all sub-objectives that belong to objectives associated with this classroom
  // Since objectives are already filtered by level when associated with classrooms,
  // we just need to find sub-objectives whose parent objectives are associated with this classroom
  const subObjectives = await prisma.subObjectives.findMany({
    where: {
      institutionId,
      deletedAt: null,
      Objectives: {
        Classes: {
          some: { id: classroomId },
        },
        deletedAt: null,
      },
    },
    include: {
      Classes: true,
    },
  });

  // Add classroom to each sub-objective (only if not already connected)
  await Promise.all(
    subObjectives.map(async (subObj) => {
      // Check if already connected to avoid duplicate connections
      const isConnected = subObj.Classes?.some((c) => c.id === classroomId);
      if (!isConnected) {
        await prisma.subObjectives.update({
          where: { id: subObj.id },
          data: {
            Classes: {
              connect: { id: classroomId },
            },
          },
        });
      }
    })
  );
}
