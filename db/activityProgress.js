import prisma from './prisma';
import { getWorkdaysCount, getYearToDateRange, getFullYearRange } from 'src/helpers/workdays';
import { getClassroom } from './class';
import { getInstitutionCores } from './institution';

/**
 * Get expected activities count based on workdays and dailyActivitiesPerDay configuration
 * @param {string} classroomId - Classroom ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<number>} Expected number of activities
 */
export async function getExpectedActivitiesCount(classroomId, startDate, endDate) {
  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    select: {
      dailyActivitiesPerDay: true,
      institutionId: true,
    },
  });

  if (!classroom || !classroom.dailyActivitiesPerDay) {
    return 0;
  }

  const workdays = await getWorkdaysCount(startDate, endDate, classroom.institutionId);
  return workdays * classroom.dailyActivitiesPerDay;
}

/**
 * Count planned activities for a classroom within a date range
 * @param {string} classroomId - Classroom ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<number>} Count of planned activities
 */
export async function getPlannedActivitiesCount(classroomId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const count = await prisma.plannedActivities.count({
    where: {
      classroomId,
      deletedAt: null,
      plannedDate: {
        gte: start,
        lte: end,
      },
    },
  });

  return count;
}

/**
 * Count evaluated activities for a classroom within a date range
 * @param {string} classroomId - Classroom ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<number>} Count of evaluated activities
 */
export async function getEvaluatedActivitiesCount(classroomId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Count distinct planned activities that have evaluations
  const evaluations = await prisma.plannedActivitiesEvaluations.findMany({
    where: {
      classroomId,
      activityPlannedDate: {
        gte: start,
        lte: end,
      },
    },
    select: {
      plannedActivityId: true,
    },
    distinct: ['plannedActivityId'],
  });

  return evaluations.length;
}

/**
 * Get planned activities grouped by core
 * @param {string} classroomId - Classroom ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of cores with planned activity counts
 */
export async function getPlannedActivitiesByCore(classroomId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Get all planned activities with their associated activities and cores
  const plannedActivities = await prisma.plannedActivities.findMany({
    where: {
      classroomId,
      deletedAt: null,
      plannedDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      Activities: {
        include: {
          Cores: {
            select: {
              id: true,
              name: true,
              position: true,
            },
          },
        },
      },
    },
  });

  // Group by core
  const coreMap = new Map();
  
  plannedActivities.forEach((pa) => {
    if (pa.Activities && pa.Activities.Cores) {
      pa.Activities.Cores.forEach((core) => {
        if (!coreMap.has(core.id)) {
          coreMap.set(core.id, {
            coreId: core.id,
            coreName: core.name,
            position: core.position,
            plannedCount: 0,
          });
        }
        coreMap.get(core.id).plannedCount++;
      });
    }
  });

  return Array.from(coreMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Get evaluated activities grouped by core
 * @param {string} classroomId - Classroom ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of cores with evaluated activity counts
 */
export async function getEvaluatedActivitiesByCore(classroomId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Get distinct planned activities that have evaluations, grouped by core
  const evaluations = await prisma.plannedActivitiesEvaluations.findMany({
    where: {
      classroomId,
      activityPlannedDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      PlannedActivities: {
        include: {
          Activities: {
            include: {
              Cores: {
                select: {
                  id: true,
                  name: true,
                  position: true,
                },
              },
            },
          },
        },
      },
    },
    distinct: ['plannedActivityId'],
  });

  // Group by core
  const coreMap = new Map();
  
  evaluations.forEach((evaluation) => {
    if (evaluation.PlannedActivities?.Activities?.Cores) {
      evaluation.PlannedActivities.Activities.Cores.forEach((core) => {
        if (!coreMap.has(core.id)) {
          coreMap.set(core.id, {
            coreId: core.id,
            coreName: core.name,
            position: core.position,
            evaluatedCount: 0,
          });
        }
        coreMap.get(core.id).evaluatedCount++;
      });
    }
  });

  return Array.from(coreMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Get planned activities grouped by objective within a core
 * @param {string} classroomId - Classroom ID
 * @param {string} coreId - Core ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of objectives with planned activity counts
 */
export async function getPlannedActivitiesByObjective(classroomId, coreId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const plannedActivities = await prisma.plannedActivities.findMany({
    where: {
      classroomId,
      deletedAt: null,
      plannedDate: {
        gte: start,
        lte: end,
      },
      Activities: {
        Cores: {
          some: { id: coreId },
        },
        Objectives: {
          some: {
            coreId: coreId,
            deletedAt: null,
          },
        },
      },
    },
    include: {
      Activities: {
        include: {
          Objectives: {
            where: {
              coreId: coreId,
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              position: true,
            },
          },
        },
      },
    },
  });

  // Group by objective
  const objectiveMap = new Map();
  
  plannedActivities.forEach((pa) => {
    if (pa.Activities && pa.Activities.Objectives) {
      pa.Activities.Objectives.forEach((objective) => {
        if (!objectiveMap.has(objective.id)) {
          objectiveMap.set(objective.id, {
            objectiveId: objective.id,
            objectiveName: objective.name,
            position: objective.position,
            plannedCount: 0,
          });
        }
        objectiveMap.get(objective.id).plannedCount++;
      });
    }
  });

  return Array.from(objectiveMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Get evaluated activities grouped by objective within a core
 * @param {string} classroomId - Classroom ID
 * @param {string} coreId - Core ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of objectives with evaluated activity counts
 */
export async function getEvaluatedActivitiesByObjective(classroomId, coreId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const evaluations = await prisma.plannedActivitiesEvaluations.findMany({
    where: {
      classroomId,
      coreId: coreId,
      activityPlannedDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      Objectives: {
        select: {
          id: true,
          name: true,
          position: true,
          coreId: true,
          deletedAt: true,
        },
      },
    },
    distinct: ['plannedActivityId', 'objectiveId'],
  });

  // Group by objective, filtering by coreId and deletedAt in JavaScript
  const objectiveMap = new Map();
  
  evaluations.forEach((evaluation) => {
    if (evaluation.Objectives && evaluation.Objectives.coreId === coreId && !evaluation.Objectives.deletedAt) {
      const objective = evaluation.Objectives;
      if (!objectiveMap.has(objective.id)) {
        objectiveMap.set(objective.id, {
          objectiveId: objective.id,
          objectiveName: objective.name,
          position: objective.position,
          evaluatedCount: 0,
        });
      }
      objectiveMap.get(objective.id).evaluatedCount++;
    }
  });

  return Array.from(objectiveMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Get planned activities grouped by sub-objective within an objective
 * @param {string} classroomId - Classroom ID
 * @param {string} objectiveId - Objective ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of sub-objectives with planned activity counts
 */
export async function getPlannedActivitiesBySubObjective(classroomId, objectiveId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const plannedActivities = await prisma.plannedActivities.findMany({
    where: {
      classroomId,
      deletedAt: null,
      plannedDate: {
        gte: start,
        lte: end,
      },
      Activities: {
        Objectives: {
          some: { id: objectiveId },
        },
        SubObjectives: {
          some: {
            objectiveId: objectiveId,
            deletedAt: null,
          },
        },
      },
    },
    include: {
      Activities: {
        include: {
          SubObjectives: {
            where: {
              objectiveId: objectiveId,
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              position: true,
            },
          },
        },
      },
    },
  });

  // Group by sub-objective
  const subObjectiveMap = new Map();
  
  plannedActivities.forEach((pa) => {
    if (pa.Activities && pa.Activities.SubObjectives) {
      pa.Activities.SubObjectives.forEach((subObjective) => {
        if (!subObjectiveMap.has(subObjective.id)) {
          subObjectiveMap.set(subObjective.id, {
            subObjectiveId: subObjective.id,
            subObjectiveName: subObjective.name,
            position: subObjective.position,
            plannedCount: 0,
          });
        }
        subObjectiveMap.get(subObjective.id).plannedCount++;
      });
    }
  });

  return Array.from(subObjectiveMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Get evaluated activities grouped by sub-objective within an objective
 * @param {string} classroomId - Classroom ID
 * @param {string} objectiveId - Objective ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of sub-objectives with evaluated activity counts
 */
export async function getEvaluatedActivitiesBySubObjective(classroomId, objectiveId, startDate, endDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const evaluations = await prisma.plannedActivitiesEvaluations.findMany({
    where: {
      classroomId,
      objectiveId: objectiveId,
      activityPlannedDate: {
        gte: start,
        lte: end,
      },
      subObjectiveId: {
        not: null,
      },
    },
    include: {
      SubObjectives: {
        select: {
          id: true,
          name: true,
          position: true,
          objectiveId: true,
          deletedAt: true,
        },
      },
    },
    distinct: ['plannedActivityId', 'subObjectiveId'],
  });

  // Group by sub-objective, filtering by objectiveId and deletedAt in JavaScript
  const subObjectiveMap = new Map();
  
  evaluations.forEach((evaluation) => {
    if (evaluation.SubObjectives && evaluation.SubObjectives.objectiveId === objectiveId && !evaluation.SubObjectives.deletedAt) {
      const subObjective = evaluation.SubObjectives;
      if (!subObjectiveMap.has(subObjective.id)) {
        subObjectiveMap.set(subObjective.id, {
          subObjectiveId: subObjective.id,
          subObjectiveName: subObjective.name,
          position: subObjective.position,
          evaluatedCount: 0,
        });
      }
      subObjectiveMap.get(subObjective.id).evaluatedCount++;
    }
  });

  return Array.from(subObjectiveMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Get comprehensive progress data for a classroom
 * @param {string} classroomId - Classroom ID
 * @param {Array} institutionCores - All cores from the institution
 * @returns {Promise<Object>} Progress data including summary and breakdowns
 */
export async function getClassroomProgress(classroomId, institutionCores = []) {
  const classroom = await getClassroom(classroomId);
  if (!classroom) {
    throw new Error('Classroom not found');
  }

  // If no cores provided, fetch them from the institution
  let coresToUse = institutionCores;
  if (!coresToUse || coresToUse.length === 0) {
    coresToUse = await getInstitutionCores(classroom.institutionId) || [];
  }

  const { startDate: yearStartDate, endDate: todayDate } = getYearToDateRange();
  const { startDate: fullYearStartDate, endDate: fullYearEndDate } = getFullYearRange();

  // Get counts
  const [
    plannedToDate,
    evaluatedToDate,
    expectedToDate,
    expectedFullYear,
    plannedByCore,
    evaluatedByCore,
  ] = await Promise.all([
    getPlannedActivitiesCount(classroomId, yearStartDate, todayDate),
    getEvaluatedActivitiesCount(classroomId, yearStartDate, todayDate),
    getExpectedActivitiesCount(classroomId, yearStartDate, todayDate),
    getExpectedActivitiesCount(classroomId, fullYearStartDate, fullYearEndDate),
    getPlannedActivitiesByCore(classroomId, yearStartDate, todayDate),
    getEvaluatedActivitiesByCore(classroomId, yearStartDate, todayDate),
  ]);

  // Start with all institution cores at 0
  const coreMap = new Map();
  coresToUse.forEach((core) => {
    // Include all cores (hide field doesn't exist in schema, but check for it if it's added later)
    if (!core.hide) {
      coreMap.set(core.id, {
        coreId: core.id,
        coreName: core.name,
        position: core.position,
        plannedCount: 0,
        evaluatedCount: 0,
      });
    }
  });

  // Update with actual planned counts
  plannedByCore.forEach((core) => {
    if (coreMap.has(core.coreId)) {
      coreMap.get(core.coreId).plannedCount = core.plannedCount;
    }
  });

  // Update with actual evaluated counts
  evaluatedByCore.forEach((core) => {
    if (coreMap.has(core.coreId)) {
      coreMap.get(core.coreId).evaluatedCount = core.evaluatedCount;
    }
  });

  return {
    summary: {
      plannedToDate: plannedToDate || 0,
      evaluatedToDate: evaluatedToDate || 0,
      expectedToDate: expectedToDate || 0,
      expectedFullYear: expectedFullYear || 0,
    },
    cores: Array.from(coreMap.values()).sort((a, b) => (a.position || 0) - (b.position || 0)),
  };
}

