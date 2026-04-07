import prisma from './prisma';
import { fullActivityQuery } from './activity';
import { ensureObjectivesLinkedToClassroom } from './objective';
import moment from 'moment-timezone';

export const planActivity = async (data) => {
  const {
    date,
    classroom,
    institution,
    teacher,
    activity,
    position,
  } = data;

  // Parse date string as UTC midnight for the given date to ensure consistent storage
  // This ensures that "2025-12-16" is stored as 2025-12-16T00:00:00.000Z (UTC midnight)
  // When read back, we'll compare dates using UTC parsing which handles timezone correctly
  const plannedDateObj = moment.utc(date).startOf('day').toDate();

  const plannedActivity = await prisma.plannedActivities.create({
    data: {
      position: position || 0,
      activityId: activity,
      teacherId: teacher,
      classroomId: classroom,
      institutionId: institution,
      plannedDate: plannedDateObj,
    },
    include: {
      Activities: {
        include: { Objectives: { select: { id: true } } },
      },
      Classes: {
        include: {
          Levels: true,
        },
      },
    },
  });

  const objectiveIds = plannedActivity.Activities?.Objectives?.map((o) => o.id) || [];
  await ensureObjectivesLinkedToClassroom(objectiveIds, classroom);

  return JSON.parse(JSON.stringify({
    ...plannedActivity,
    classroom: {
      ...plannedActivity.Classes,
      level: plannedActivity.Classes.Levels,
    },
    activity: plannedActivity.Activities,
  }));
}

export const updatePlannedActivity = async (id, data) => {
  const {
    position,
    plannedDate,
    activityId,
  } = data;

  const updateData = {};
  if (position !== undefined) updateData.position = position;
  // Parse date string as UTC midnight for the given date to ensure consistent storage
  if (plannedDate) updateData.plannedDate = typeof plannedDate === 'string' ? moment.utc(plannedDate).startOf('day').toDate() : plannedDate;
  if (activityId) updateData.activityId = activityId;

  const plannedActivity = await prisma.plannedActivities.update({
    where: { id },
    data: updateData,
    include: {
      Classes: {
        include: {
          Levels: true,
        },
      },
      Activities: true,
    },
  });

  if (activityId) {
    const activityWithObjectives = await prisma.activities.findUnique({
      where: { id: activityId },
      select: { Objectives: { select: { id: true } } },
    });
    const objectiveIds = activityWithObjectives?.Objectives?.map((o) => o.id) || [];
    await ensureObjectivesLinkedToClassroom(objectiveIds, plannedActivity.classroomId);
  }

  const activityData = await fullActivityQuery(plannedActivity.activityId);

  return JSON.parse(JSON.stringify({
    ...plannedActivity,
    classroom: {
      ...plannedActivity.Classes,
      level: plannedActivity.Classes.Levels,
    },
    activity: activityData || plannedActivity.Activities,
  }));
}

export const getPlannedActivity = async (id) => {
  const plannedActivity = await prisma.plannedActivities.findUnique({
    where: { id },
    include: {
      Classes: {
        include: {
          Levels: true,
        },
      },
      Activities: true,
    },
  });

  if (!plannedActivity) return null;

  const activityData = await fullActivityQuery(plannedActivity.activityId);

  return JSON.parse(JSON.stringify({
    ...plannedActivity,
    classroom: {
      ...plannedActivity.Classes,
      level: plannedActivity.Classes.Levels,
    },
    activity: activityData || plannedActivity.Activities,
  }));
}

export const getPlannedActivitiesByClassroomAndDates = async (classroomId, startDate, endDate) => {
  // Ensure dates are properly formatted for the query
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
    },
    include: {
      Classes: {
        include: {
          Levels: true,
        },
      },
      Activities: true,
    },
    orderBy: { position: 'asc' },
  });

  const activitiesWithFullData = await Promise.all(
    plannedActivities.map(async (pa) => {
      const activityData = await fullActivityQuery(pa.activityId);
      return {
        ...pa,
        classroom: {
          ...pa.Classes,
          level: pa.Classes.Levels,
        },
        activity: activityData || pa.Activities,
      };
    })
  );

  return JSON.parse(JSON.stringify(activitiesWithFullData));
};

export const getCommunityPlannedActivitiesWithinDates = async (startDate, endDate, pageSize) => {
  const plannedActivities = await prisma.plannedActivities.findMany({
    where: {
      deletedAt: null,
      plannedDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      Activities: {
        openToCommunity: true,
        deletedAt: null,
      },
    },
    include: {
      Activities: {
        select: {
          openToCommunity: true,
          creatorId: true,
        },
      },
      users_PlannedActivities_teacherIdTousers: {
        select: { id: true },
      },
    },
    take: pageSize,
  });

  return plannedActivities.map((pa) => ({
    openToCommunity: pa.Activities.openToCommunity,
    creator: pa.Activities.creatorId,
    planner: pa.users_PlannedActivities_teacherIdTousers.id,
  }));
};

export const countPlannedActivitiesForTeacher = async (teacherId) => {
  const count = await prisma.plannedActivities.count({
    where: {
      teacherId,
      deletedAt: null,
    },
  });

  return count;
}

export const deletePlannedActivity = async (plannedActivityId, userId) => {
  const plannedActivity = await prisma.plannedActivities.update({
    where: { id: plannedActivityId },
    data: {
      deletedAt: new Date(),
      deletedById: userId,
    },
  });

  return plannedActivity;
}
