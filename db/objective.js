import prisma from './prisma';
import moment from 'moment-timezone';

export const createObjectiveForClassrooms = async ({ name, core, classrooms, user }) => {
  // Get levels from classrooms
  const classroomRecords = await prisma.classes.findMany({
    where: { id: { in: classrooms } },
    include: { Levels: true },
  });

  const levelIds = [...new Set(classroomRecords.map((c) => c.levelId))];

  const objective = await prisma.objectives.create({
          data: {
      name,
      coreId: core,
      createdById: user.id,
      Classes: {
        connect: classrooms.map((id) => ({ id })),
      },
      ObjectiveLevels: {
        create: levelIds.map((id) => ({
          Levels: {
            connect: { id },
          },
        })),
      },
    },
    include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
    },
  });

    return JSON.parse(JSON.stringify({
      ...objective,
      core: objective.Cores,
      levels: objective.ObjectiveLevels?.map(ol => ol.Levels) || [],
      classrooms: objective.Classes,
    }));
}

export const createObjectiveForClassroomsMassively = async ({ objectives, user }) => {
  const createdObjectives = await Promise.all(
    objectives.map(async (objective) => {
      let levelIds = [];
      let classroomIds = objective.classroomsIds || [];

      // If levelIds are provided, use them directly
      if (objective.levelIds && objective.levelIds.length > 0) {
        levelIds = objective.levelIds;
      } else if (classroomIds.length > 0) {
        // Otherwise, derive levels from classrooms
        const classroomRecords = await prisma.classes.findMany({
          where: { id: { in: classroomIds } },
          include: { Levels: true },
        });
        levelIds = [...new Set(classroomRecords.map((c) => c.levelId))];
      }

      const createData = {
        name: objective.name,
        coreId: objective.coreId,
        createdById: user.id,
      };

      // Add curricular objective if provided
      if (objective.curricularObjectiveId) {
        createData.curricularObjectiveId = objective.curricularObjectiveId;
      }

      // Only connect levels if we have any
      if (levelIds.length > 0) {
        createData.ObjectiveLevels = {
          create: levelIds.map((id) => ({
            Levels: {
              connect: { id },
            },
          })),
        };
      }

      // Only connect classrooms if provided
      if (classroomIds.length > 0) {
        createData.Classes = {
          connect: classroomIds.map((id) => ({ id })),
        };
      }

      return await prisma.objectives.create({
        data: createData,
        include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
        },
      });
    })
  );

  return createdObjectives.map((obj) => ({
    ...obj,
    core: obj.core,
    levels: obj.levels,
    classrooms: obj.classrooms,
  }));
}

export const getObjective = async (objectiveId) => {
  const objective = await prisma.objectives.findUnique({
    where: { id: objectiveId },
    include: {
      Classes: true,
    },
  });
  if (!objective) return null;
  return JSON.parse(JSON.stringify({
    ...objective,
    classrooms: objective.Classes || [],
  }));
};

export const softDeleteObjective = async (objectiveId) => {
  const objective = await prisma.objectives.update({
    where: { id: objectiveId },
    data: { deletedAt: new Date() },
  });

  return objective;
}

export const deleteObjectiveFromClassroom = async (objectiveId, classroomId) => {
  const objective = await prisma.objectives.findUnique({
    where: { id: objectiveId },
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
    },
  });

  if (!objective) return null;

  const remainingClassrooms = objective.Classes.filter((c) => c.id !== classroomId);
  const remainingLevelIds = [...new Set(remainingClassrooms.map((c) => c.levelId))];

  const updated = await prisma.objectives.update({
    where: { id: objectiveId },
          data: {
      Classes: {
        set: remainingClassrooms.map((c) => ({ id: c.id })),
      },
      ObjectiveLevels: {
        deleteMany: {},
        create: remainingLevelIds.map((id) => ({
          Levels: {
            connect: { id },
          },
        })),
      },
    },
    include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
    },
  });

  return JSON.parse(JSON.stringify({
    ...updated,
    core: updated.core,
    levels: updated.levels,
    classrooms: updated.classrooms,
  }));
}

export const updateObjective = async (objectiveId, { name, position, newClassroom, curricularObjective }) => {
  const updateData = {};
  
  if (name) updateData.name = name;
  if (position !== undefined) updateData.position = position;
  if (curricularObjective !== undefined) {
    updateData.curricularObjectiveId = curricularObjective || null;
  }

  if (newClassroom) {
    const objective = await prisma.objectives.findUnique({
      where: { id: objectiveId },
      include: {
        Classes: {
          include: { Levels: true },
        },
      },
    });

    const newClassroomRecord = await prisma.classes.findUnique({
      where: { id: newClassroom },
      include: { Levels: true },
    });

    if (objective && newClassroomRecord) {
      const allClassrooms = [...objective.Classes, newClassroomRecord];
      const allLevelIds = [...new Set(allClassrooms.map((c) => c.levelId))];

      updateData.Classes = {
        set: allClassrooms.map((c) => ({ id: c.id })),
      };
      updateData.ObjectiveLevels = {
        deleteMany: {},
        create: allLevelIds.map((id) => ({
          Levels: {
            connect: { id },
          },
        })),
      };

      const childSubObjectives = await prisma.subObjectives.findMany({
        where: { objectiveId, deletedAt: null },
      });
      for (const sub of childSubObjectives) {
        await prisma.subObjectives.update({
          where: { id: sub.id },
          data: {
            Levels: { set: allLevelIds.map((id) => ({ id })) },
            Classes: { set: allClassrooms.map((c) => ({ id: c.id })) },
          },
        });
      }
    }
  }

  const objective = await prisma.objectives.update({
    where: { id: objectiveId },
    data: updateData,
    include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
      CurricularObjectives: true,
    },
  });

    return JSON.parse(JSON.stringify({
      ...objective,
      core: objective.Cores,
      levels: objective.ObjectiveLevels?.map(ol => ol.Levels) || [],
      classrooms: objective.Classes || [],
      curricularObjective: objective.CurricularObjectives,
    }));
}

export const getObjectivesWithAdvancementByIds = async ({
  ids,
  classroomId,
  institutionId,
  startDate = moment().startOf('year').toISOString(),
  endDate = moment().add(1, 'day').toISOString(),
}) => {
  try {
    const students = await prisma.students.findMany({
      where: {
        classId: classroomId,
        deactivatedAt: null,
        deletedAt: null,
      },
    });

    const objectives = await prisma.objectives.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      include: {
        Cores: true,
        ObjectiveLevels: {
          include: {
            Levels: true,
          },
        },
        SubObjectives: {
          where: { deletedAt: null },
        },
        Evaluations: {
          where: {
            studentId: { in: students.map((s) => s.id) },
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          include: {
            Students: true,
            LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
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

    const transformed = objectives.map((obj) => {
      const studentsLevelOfAchievement = students.map((student) => {
        const evaluation = obj.Evaluations.find((e) => e.studentId === student.id);
        return {
          student: {
            ...student,
            fullName: `${student.firstName} ${student.lastName}`,
          },
          levelOfAchievement: evaluation?.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement || defaultLevel || null,
          evaluatedAt: evaluation?.createdAt || null,
        };
      });

      return {
        ...obj,
        core: obj.Cores,
        levels: obj.ObjectiveLevels?.map(ol => ol.Levels) || [],
        subObjectives: obj.SubObjectives,
        studentsLevelOfAchievement,
      };
    });

    return JSON.parse(JSON.stringify(transformed));
  } catch (er) {
    console.error(er);
    return [];
  }
}

export const addClassroomToObjectivesByLevelAndInstitution = async (classroomId, levelId, institutionId) => {
  // Find all objectives for this institution and level
  const objectives = await prisma.objectives.findMany({
    where: {
      Cores: {
        institutionId,
      },
      ObjectiveLevels: {
        some: {
          Levels: {
            id: levelId,
          },
        },
      },
      deletedAt: null,
    },
  });

  // Add classroom to each objective
  await Promise.all(
    objectives.map((obj) =>
      prisma.objectives.update({
        where: { id: obj.id },
              data: {
          Classes: {
            connect: { id: classroomId },
          },
        },
      })
        )
  );
}

export const removeClassroomFromObjectives = async (classroomId) => {
  const objectives = await prisma.objectives.findMany({
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
    objectives.map(async (obj) => {
      const remainingClassrooms = obj.Classes.filter((c) => c.id !== classroomId);
      const remainingLevelIds = [...new Set(remainingClassrooms.map((c) => c.levelId))];

      await prisma.objectives.update({
        where: { id: obj.id },
        data: {
          Classes: {
            set: remainingClassrooms.map((c) => ({ id: c.id })),
          },
          ObjectiveLevels: {
            deleteMany: {},
            create: remainingLevelIds.map((id) => ({
              Levels: {
                connect: { id },
              },
            })),
          },
        },
      });
    })
  );
}

export const removeClassroomFromObjectivesQuery = removeClassroomFromObjectives;

// Additional helper functions
export const getObjectivesByClassroom = async (classroomId) => {
  const objectives = await prisma.objectives.findMany({
    where: {
      Classes: {
        some: { id: classroomId },
      },
      deletedAt: null,
    },
    include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
    },
  });

  return objectives;
}

export const getObjectivesByCoresClassroom = async (coreIds, classroomId) => {
  const objectives = await prisma.objectives.findMany({
    where: {
      coreId: { in: coreIds },
      Classes: {
        some: { id: classroomId },
      },
      deletedAt: null,
    },
    include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
      CurricularObjectives: true,
      SubObjectives: {
        where: { deletedAt: null },
      },
    },
    orderBy: { position: 'asc' },
  });

  return objectives.map((obj) => ({
    ...obj,
    core: obj.Cores,
    levels: obj.ObjectiveLevels?.map(ol => ol.Levels) || [],
    classrooms: obj.Classes,
    curricularObjective: obj.CurricularObjectives,
    subObjectives: obj.SubObjectives || [],
  }));
}

export const getObjectivesByInstitution = async (institutionId) => {
  const objectives = await prisma.objectives.findMany({
    where: {
      Cores: {
        institutionId,
      },
      deletedAt: null,
    },
    include: {
      Cores: true,
      ObjectiveLevels: {
        include: {
          Levels: true,
        },
      },
      Classes: true,
      CurricularObjectives: true,
    },
    orderBy: { position: 'asc' },
  });

  return objectives.map((obj) => ({
    ...obj,
    core: obj.Cores,
    levels: obj.ObjectiveLevels?.map(ol => ol.Levels) || [],
    classrooms: obj.Classes,
    curricularObjective: obj.CurricularObjectives,
  }));
}

export const countAllObjectivesForInstitution = async (institutionId) => {
  const count = await prisma.objectives.count({
    where: {
      Cores: {
        institutionId,
      },
      deletedAt: null,
    },
  });

  return count;
}

export const ensureObjectivesLinkedToClassroom = async (objectiveIds, classroomId) => {
  if (!objectiveIds?.length || !classroomId) return;

  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    include: { Levels: true },
  });
  if (!classroom) return;

  const unlinkedObjectives = await prisma.objectives.findMany({
    where: {
      id: { in: objectiveIds },
      deletedAt: null,
      NOT: { Classes: { some: { id: classroomId } } },
    },
    include: {
      Classes: { include: { Levels: true } },
    },
  });

  await Promise.all(
    unlinkedObjectives.map(async (objective) => {
      const allClassrooms = [...objective.Classes, classroom];
      const allLevelIds = [...new Set(allClassrooms.map((c) => c.levelId))];

      await prisma.objectives.update({
        where: { id: objective.id },
        data: {
          Classes: {
            set: allClassrooms.map((c) => ({ id: c.id })),
          },
          ObjectiveLevels: {
            deleteMany: {},
            create: allLevelIds.map((id) => ({
              Levels: { connect: { id } },
            })),
          },
        },
      });
    })
  );
}
