import prisma from './prisma';
import moment from 'moment-timezone';

/** Observations.assets is TEXT[]; UI sends Cloudinary objects — store each as JSON string. */
const serializeObservationAssets = (assets) => {
  if (!Array.isArray(assets)) return [];
  return assets.map((item) =>
    typeof item === 'string' ? item : JSON.stringify(item),
  );
};

export const parseObservationAssets = (assets) => {
  if (!Array.isArray(assets)) return [];
  return assets
    .map((item) => {
      if (item == null) return null;
      if (typeof item === 'object') return item;
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          return typeof parsed === 'object' && parsed !== null ? parsed : null;
        } catch {
          return null;
        }
      }
      return null;
    })
    .filter(Boolean);
};

const BASE_OBSERVATION = {
  students: [],
  description: '',
  assets: [],
  core: null,
  teacher: null,
  institution: null,
  observedAt: null,
  classroom: null,
  plannedActivity: null,
}

export const createObservation = async (data) => {
  const mergedData = { ...BASE_OBSERVATION, ...data };
  const {
    students,
    description,
    assets,
    core,
    teacher,
    institution,
    observedAt,
    classroom,
    plannedActivity,
  } = mergedData;

  const observation = await prisma.observations.create({
        data: {
          description,
      assets: serializeObservationAssets(assets),
      coreId: core || null,
      teacherId: teacher,
      institutionId: institution || null,
      observedAt: observedAt ? new Date(observedAt) : new Date(),
      classroomId: classroom,
      plannedActivityId: plannedActivity || null,
      Students: {
        connect: students.map((id) => ({ id })),
      },
    },
    include: {
      Students: true,
      users: true,
      Classes: true,
      Institutions: true,
      Cores: true,
      PlannedActivities: true,
        },
  });

  // Transform to lowercase for backward compatibility
  return {
    ...observation,
    assets: parseObservationAssets(observation.assets),
    students: observation.Students || [],
    teacher: observation.users,
    classroom: observation.Classes,
    institution: observation.Institutions,
    core: observation.Cores,
    plannedActivity: observation.PlannedActivities,
  };
}

export const updateObservation = async (id, data) => {
  const {
    students,
    description,
    assets,
    core,
    updatedBy,
    observedAt,
  } = data;

  const updateData = {
    description,
    coreId: core || null,
  };

  if (assets !== undefined) {
    updateData.assets = serializeObservationAssets(assets ?? []);
  }

  if (students) {
    updateData.Students = {
      set: students.map((id) => ({ id })),
    };
  }

  if (observedAt) {
    updateData.observedAt = new Date(observedAt);
  }

  const observation = await prisma.observations.update({
    where: { id },
    data: updateData,
    include: {
      Students: true,
    },
  });

  // Transform to lowercase for backward compatibility
  return {
    ...observation,
    assets: parseObservationAssets(observation.assets),
    students: observation.Students || [],
  };
}

export const getObservation = async (id) => {
  const observation = await prisma.observations.findUnique({
    where: { id },
    include: {
      Students: true,
      users: true,
      Classes: true,
      Institutions: true,
      Cores: true,
      PlannedActivities: true,
    },
  });

  if (!observation) return null;

  // Transform to lowercase for backward compatibility
  const transformed = {
    ...observation,
    assets: parseObservationAssets(observation.assets),
    students: observation.Students || [],
    teacher: observation.users,
    classroom: observation.Classes,
    institution: observation.Institutions,
    core: observation.Cores,
    plannedActivity: observation.PlannedActivities,
  };

  return JSON.parse(JSON.stringify(transformed));
}

export const softDeleteObservation = async (id) => {
  const observation = await prisma.observations.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return observation;
}

export const getObservationsByStudent = async (studentId) => {
  const observations = await prisma.observations.findMany({
    where: {
      Students: {
        some: { id: studentId },
      },
      deletedAt: null,
    },
    include: {
      Students: true,
      users: true,
      Classes: {
        include: { Levels: true },
      },
      Cores: true,
      PlannedActivities: true,
    },
    orderBy: { observedAt: 'desc' },
  });

  // Transform to lowercase for backward compatibility
  return observations.map(obs => ({
    ...obs,
    assets: parseObservationAssets(obs.assets),
    students: obs.Students || [],
    teacher: obs.users,
    classroom: obs.Classes,
    core: obs.Cores,
    plannedActivity: obs.PlannedActivities,
  }));
}

export const getObservationsByClassAndCore = async (classroomId, coreId) => {
  const observations = await prisma.observations.findMany({
    where: {
      classroomId,
      coreId,
      deletedAt: null,
    },
    include: {
      Students: {
        where: {
          deactivatedAt: null,
          deletedAt: null,
        },
      },
      users: true,
      Classes: true,
      Cores: true,
          },
  });

  // Transform to lowercase for backward compatibility
  const transformed = observations.map(obs => ({
    ...obs,
    assets: parseObservationAssets(obs.assets),
    students: obs.Students || [],
    teacher: obs.users,
    classroom: obs.Classes,
    core: obs.Cores,
  }));

  // Filter out observations with only deactivated students
  const filtered = transformed.filter((obs) => {
    const hasNoStudents = obs.students.length === 0;
    const hasAtLeastOneStudentActive = obs.students.some((s) => !s.deactivatedAt);
    return hasNoStudents || hasAtLeastOneStudentActive;
  });

  return filtered;
}

export const getObservationsByClass = async (classroomId, { startDate, endDate } = {}) => {
  const where = {
    classroomId,
    deletedAt: null,
  };

  if (startDate && endDate) {
    where.observedAt = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const observations = await prisma.observations.findMany({
    where,
    include: {
      Students: {
        where: {
          deactivatedAt: null,
          deletedAt: null,
        },
      },
      users: true,
      Classes: true,
      Cores: true,
      PlannedActivities: true,
    },
    orderBy: { observedAt: 'desc' },
  });

  // Transform to lowercase for backward compatibility
  return observations.map(obs => ({
    ...obs,
    assets: parseObservationAssets(obs.assets),
    students: obs.Students || [],
    teacher: obs.users,
    classroom: obs.Classes,
    core: obs.Cores,
    plannedActivity: obs.PlannedActivities,
  }));
}

export const getFullObservationsByClass = async ({ classroomId, pageSize = 20, after, startDate, endDate }) => {
  const where = {
    classroomId,
    deletedAt: null,
  };

  if (startDate && endDate) {
    where.observedAt = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  // Prisma cursor-based pagination
  // Since we order by [observedAt desc, id desc], items that come AFTER the cursor are:
  // observedAt < cursor.observedAt, OR (observedAt === cursor.observedAt AND id < cursor.id).
  // observedAt only has day precision, so many rows tie on it — the tie-break must compare
  // id with `lt` (matching the secondary sort direction), not just exclude the cursor's own id,
  // otherwise rows tied with the cursor and already returned on the previous page reappear.
  if (after) {
    const cursorObservation = await prisma.observations.findUnique({
      where: { id: after },
      select: { observedAt: true },
    });

    if (cursorObservation) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { observedAt: { lt: cursorObservation.observedAt } },
            {
              AND: [
                { observedAt: cursorObservation.observedAt },
                { id: { lt: after } },
              ],
            },
          ],
        },
      ];
    }
  }

  const observations = await prisma.observations.findMany({
    where,
    include: {
      Students: {
        where: {
          deactivatedAt: null,
          deletedAt: null,
        },
      },
      users: true,
      Classes: true,
      Cores: true,
      PlannedActivities: true,
    },
    take: pageSize,
    orderBy: [
      { observedAt: 'desc' },
      { id: 'desc' }, // Secondary sort for consistent ordering
    ],
  });

  // Return the last item's ID as the next cursor, or null if no more pages
  const nextCursor = observations.length === pageSize ? observations[observations.length - 1].id : null;

  // Transform to lowercase for backward compatibility
  return {
    data: observations.map(obs => ({
      ...obs,
      assets: parseObservationAssets(obs.assets),
      students: obs.Students || [],
      teacher: obs.users,
      classroom: obs.Classes,
      core: obs.Cores,
      plannedActivity: obs.PlannedActivities,
    })),
    after: nextCursor,
  };
}

export const getObservationsByInstitution = async (institutionId) => {
  const observations = await prisma.observations.findMany({
    where: {
      institutionId,
      deletedAt: null,
    },
    include: {
      Students: {
        where: {
          deactivatedAt: null,
          deletedAt: null,
        },
      },
      users: true,
      Classes: true,
      Cores: true,
    },
    take: 10000,
  });

  // Transform to lowercase for backward compatibility
  return observations.map(obs => ({
    ...obs,
    assets: parseObservationAssets(obs.assets),
    students: obs.Students || [],
    teacher: obs.users,
    classroom: obs.Classes,
    core: obs.Cores,
  }));
}

export const getObservationsByPlannedActivity = async (plannedActivityId) => {
  const observations = await prisma.observations.findMany({
    where: {
      plannedActivityId,
      deletedAt: null,
    },
    include: {
      Students: true,
      users: true,
      Classes: true,
      Cores: true,
      PlannedActivities: true,
    },
  });

  // Transform to lowercase for backward compatibility
  return observations.map(obs => ({
    ...obs,
    assets: parseObservationAssets(obs.assets),
    students: obs.Students || [],
    teacher: obs.users,
    classroom: obs.Classes,
    core: obs.Cores,
    plannedActivity: obs.PlannedActivities,
  }));
}
