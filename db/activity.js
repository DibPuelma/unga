import prisma from './prisma';
import { getCurricularObjectiveByName } from './curricularObjectives';

const BASE_ACTIVITY = {
  name: '',
  sponsorInstitution: null,
  recommendedLevels: [],
  cores: [],
  transversalCores: [],
  specificCores: [],
  transversalCurricularObjectives: [],
  specificCurricularObjectives: [],
  transversalObjectives: [],
  specificObjectives: [],
  transversalSubObjectives: [],
  specificSubObjectives: [],
  ideaOrigin: '',
  ideaOriginDetails: '',
  description: '',
  familyParticipation: '',
  adultRole: '',
  steps: [],
  materials: [],
  assets: {},
};

const handleCurricularObjectives = async (specificCurricularObjectivesNames, transversalCurricularObjectivesNames, institutionId) => {
  const curricularObjectivesIds = [];
  const specificCurricularObjectivesIds = [];
  const transversalCurricularObjectivesIds = [];

  if (specificCurricularObjectivesNames.length > 0 && institutionId) {
    for (const name of specificCurricularObjectivesNames) {
      const obj = await getCurricularObjectiveByName(name, institutionId);
      if (obj) {
        const id = obj.id;
        specificCurricularObjectivesIds.push(id);
        curricularObjectivesIds.push(id);
      }
    }
  }

  if (transversalCurricularObjectivesNames.length > 0 && institutionId) {
    for (const name of transversalCurricularObjectivesNames) {
      const obj = await getCurricularObjectiveByName(name, institutionId);
      if (obj) {
        const id = obj.id;
        transversalCurricularObjectivesIds.push(id);
        curricularObjectivesIds.push(id);
      }
    }
  }

  return { specificCurricularObjectivesIds, transversalCurricularObjectivesIds, curricularObjectivesIds };
}

export const createActivity = async (data) => {
  const mergedData = { ...BASE_ACTIVITY, ...data };
  const {
    sponsorInstitution,
    creator,
    recommendedLevels,
    cores,
    transversalCores,
    specificCores,
    specificCurricularObjectivesNames = [],
    transversalCurricularObjectivesNames = [],
    transversalCurricularObjectives,
    specificCurricularObjectives,
    objectives = [],
    transversalObjectives = [],
    specificObjectives = [],
    subObjectives = [],
    transversalSubObjectives = [],
    specificSubObjectives = [],
    consequentialCurricularObjectives = [],
    theme,
    ...rest
  } = mergedData;

  const {
    specificCurricularObjectivesIds,
    transversalCurricularObjectivesIds,
    curricularObjectivesIds,
  } = await handleCurricularObjectives(specificCurricularObjectivesNames, transversalCurricularObjectivesNames, sponsorInstitution);

  const allCores = [...cores, ...transversalCores, ...specificCores];
  const allObjectives = [...objectives, ...transversalObjectives, ...specificObjectives];
  const allSubObjectives = [...subObjectives, ...transversalSubObjectives, ...specificSubObjectives];

  try {
    const activity = await prisma.activities.create({
      data: {
        ...rest,
        sponsorInstitutionId: sponsorInstitution || null,
        creatorId: creator,
        themeId: theme || null,
        Levels: {
          connect: recommendedLevels.map((id) => ({ id })),
        },
        Cores: {
          connect: allCores.map((id) => ({ id })),
        },
        Objectives: {
          connect: allObjectives.map((id) => ({ id })),
        },
        SubObjectives: {
          connect: allSubObjectives.map((id) => ({ id })),
        },
        CurricularObjectives: {
          connect: curricularObjectivesIds.map((id) => ({ id })),
        },
        ConsequentialCurricularObjectives: {
          connect: consequentialCurricularObjectives.map((id) => ({ id })),
        },
      },
      include: {
        Institutions_Activities_sponsorInstitutionIdToInstitutions: true,
        Institutions_Activities_originalSponsorInstitutionIdToInstitutions: true,
        users_Activities_creatorIdTousers: true,
        users_Activities_updatedByIdTousers: true,
        ActivitiesThemes: true,
        Levels: true,
        Cores: true,
        Objectives: true,
        SubObjectives: true,
        CurricularObjectives: {
          include: {
            Cores: true,
          },
        },
        ConsequentialCurricularObjectives: true,
      },
    });

    return activity;
  } catch (e) {
    console.log('ERROR ------------------------------------------');
    console.log(e);
    throw e;
  }
}

export const updateActivity = async (activityId, data) => {
  const {
    recommendedLevels = [],
    transversalCores = [],
    specificCores = [],
    transversalObjectives = [],
    specificObjectives = [],
    transversalCurricularObjectives = [],
    specificCurricularObjectives = [],
    transversalSubObjectives = [],
    specificSubObjectives = [],
    consequentialCurricularObjectives = [],
    theme,
    updatedBy,
    sponsorInstitution,
    originalSponsorInstitution,
    ...rest
  } = data;

  const allCores = [...transversalCores, ...specificCores];
  const allObjectives = [...transversalObjectives, ...specificObjectives];
  const allSubObjectives = [...transversalSubObjectives, ...specificSubObjectives];
  const allCurricularObjectives = [...transversalCurricularObjectives, ...specificCurricularObjectives];

  // Remove fields from rest that shouldn't be directly updated or will be set explicitly
  const {
    sponsorInstitutionId: restSponsorInstitutionId,
    originalSponsorInstitutionId: restOriginalSponsorInstitutionId,
    updatedById: restUpdatedById,
    themeId: restThemeId,
    ...cleanRest
  } = rest;

  const updateData = {
    ...cleanRest,
    updatedById: updatedBy || null,
    themeId: theme || null,
    sponsorInstitutionId: sponsorInstitution || null,
    originalSponsorInstitutionId: originalSponsorInstitution || null,
  };

  // Remove fields that shouldn't be in updateData
  // Prisma relation fields (these are read-only, included in queries)
  delete updateData.Institutions_Activities_sponsorInstitutionIdToInstitutions;
  delete updateData.Institutions_Activities_originalSponsorInstitutionIdToInstitutions;
  delete updateData.users_Activities_creatorIdTousers;
  delete updateData.users_Activities_updatedByIdTousers;
  delete updateData.ActivitiesThemes;
  delete updateData.Levels;
  delete updateData.Cores;
  delete updateData.Objectives;
  delete updateData.SubObjectives;
  delete updateData.CurricularObjectives;
  delete updateData.ConsequentialCurricularObjectives;
  
  // Computed/virtual fields
  delete updateData.sponsorInstitution;
  delete updateData.originalSponsorInstitution;
  delete updateData.updatedBy;
  delete updateData.theme;
  delete updateData.creator;
  delete updateData.coresNames;
  
  // Fields that shouldn't be updated
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.creatorId;
  delete updateData.deletedAt;
  delete updateData.updatedAt;
  delete updateData.specificCores;
  delete updateData.transversalCores;
  delete updateData.specificObjectives;
  delete updateData.transversalObjectives;
  delete updateData.specificSubObjectives;
  delete updateData.transversalSubObjectives;
  delete updateData.specificCurricularObjectives;
  delete updateData.transversalCurricularObjectives;

  // Always set relations if they're provided in the data (even if empty arrays)
  if (recommendedLevels !== undefined) {
    updateData.Levels = { set: recommendedLevels.map((id) => ({ id })) };
  }
  if (allCores !== undefined) {
    updateData.Cores = { set: allCores.map((id) => ({ id })) };
  }
  if (allObjectives !== undefined) {
    updateData.Objectives = { set: allObjectives.map((id) => ({ id })) };
  }
  if (allSubObjectives !== undefined) {
    updateData.SubObjectives = { set: allSubObjectives.map((id) => ({ id })) };
  }
  if (allCurricularObjectives !== undefined) {
    updateData.CurricularObjectives = { set: allCurricularObjectives.map((id) => ({ id })) };
  }
  if (consequentialCurricularObjectives !== undefined) {
    updateData.ConsequentialCurricularObjectives = { set: consequentialCurricularObjectives.map((id) => ({ id })) };
  }

  const activity = await prisma.activities.update({
    where: { id: activityId },
    data: updateData,
    include: {
      Institutions_Activities_sponsorInstitutionIdToInstitutions: true,
      Institutions_Activities_originalSponsorInstitutionIdToInstitutions: true,
      users_Activities_creatorIdTousers: true,
      users_Activities_updatedByIdTousers: true,
      ActivitiesThemes: true,
      Levels: true,
      Cores: true,
      Objectives: true,
      SubObjectives: true,
      CurricularObjectives: {
        include: {
          Cores: true,
        },
      },
      ConsequentialCurricularObjectives: true,
    },
  });

  return {
    ...activity,
    sponsorInstitution: activity.Institutions_Activities_sponsorInstitutionIdToInstitutions,
    originalSponsorInstitution: activity.Institutions_Activities_originalSponsorInstitutionIdToInstitutions,
    creator: activity.users_Activities_creatorIdTousers,
    updatedBy: activity.users_Activities_updatedByIdTousers,
    theme: activity.ActivitiesThemes,
    recommendedLevels: activity.Levels,
  };
}

export const softDeleteActivity = async (activityId) => {
  const activity = await prisma.activities.update({
    where: { id: activityId },
    data: { deletedAt: new Date() },
  });

  return activity;
}

export const fullActivityQuery = async (activityId) => {
  const activity = await prisma.activities.findUnique({
    where: { id: activityId },
    include: {
      Institutions_Activities_sponsorInstitutionIdToInstitutions: true,
      Institutions_Activities_originalSponsorInstitutionIdToInstitutions: true,
      users_Activities_creatorIdTousers: true,
      users_Activities_updatedByIdTousers: true,
      ActivitiesThemes: true,
      Levels: true,
      Cores: true,
      Objectives: true,
      SubObjectives: true,
      CurricularObjectives: {
        include: {
          Cores: true,
        },
      },
      ConsequentialCurricularObjectives: true,
    },
  });

  if (!activity) return null;

  // Ensure arrays exist (defensive check)
  const cores = activity.Cores || [];
  const objectives = activity.Objectives || [];
  const subObjectives = activity.SubObjectives || [];
  const curricularObjectives = activity.CurricularObjectives || [];
  const consequentialCurricularObjectives = activity.ConsequentialCurricularObjectives || [];

  // Separate cores by type
  const transversalCores = cores.filter(core => core.type === 'transversal');
  const specificCores = cores.filter(core => core.type === 'specific');

  // Separate objectives by type (based on their core)
  const transversalObjectives = objectives.filter(obj => {
    const core = cores.find(c => c.id === obj.coreId);
    return core && core.type === 'transversal';
  });
  const specificObjectives = objectives.filter(obj => {
    const core = cores.find(c => c.id === obj.coreId);
    return core && core.type === 'specific';
  });

  // Separate sub-objectives by type (based on their core)
  const transversalSubObjectives = subObjectives.filter(subObj => {
    const core = cores.find(c => c.id === subObj.coreId);
    return core && core.type === 'transversal';
  });
  const specificSubObjectives = subObjectives.filter(subObj => {
    const core = cores.find(c => c.id === subObj.coreId);
    return core && core.type === 'specific';
  });

  // Separate curricular objectives by type (based on their core)
  const transversalCurricularObjectives = curricularObjectives.filter(co => {
    const core = co.Cores;
    return core && core.type === 'transversal';
  });
  const specificCurricularObjectives = curricularObjectives.filter(co => {
    const core = co.Cores;
    return core && core.type === 'specific';
  });

  return {
    ...activity,
    sponsorInstitution: activity.Institutions_Activities_sponsorInstitutionIdToInstitutions,
    originalSponsorInstitution: activity.Institutions_Activities_originalSponsorInstitutionIdToInstitutions,
    creator: activity.users_Activities_creatorIdTousers,
    updatedBy: activity.users_Activities_updatedByIdTousers,
    theme: activity.ActivitiesThemes,
    recommendedLevels: activity.Levels || [],
    cores: cores,
    transversalCores: transversalCores,
    specificCores: specificCores,
    objectives: objectives,
    transversalObjectives: transversalObjectives,
    specificObjectives: specificObjectives,
    subObjectives: subObjectives,
    transversalSubObjectives: transversalSubObjectives,
    specificSubObjectives: specificSubObjectives,
    curricularObjectives: curricularObjectives,
    transversalCurricularObjectives: transversalCurricularObjectives,
    specificCurricularObjectives: specificCurricularObjectives,
    consequentialCurricularObjectives: consequentialCurricularObjectives,
  };
}

export const getActivitiesByInstitution = async (institutionId, pageSize = 25) => {
  const activities = await prisma.activities.findMany({
    where: {
      sponsorInstitutionId: institutionId,
      deletedAt: null,
    },
    include: {
      Institutions_Activities_sponsorInstitutionIdToInstitutions: true,
      Institutions_Activities_originalSponsorInstitutionIdToInstitutions: true,
      users_Activities_creatorIdTousers: true,
      users_Activities_updatedByIdTousers: true,
      ActivitiesThemes: true,
      Levels: true,
      Cores: true,
      Objectives: true,
      SubObjectives: true,
      CurricularObjectives: {
        include: {
          Cores: true,
        },
      },
      ConsequentialCurricularObjectives: true,
    },
    take: pageSize,
    orderBy: { createdAt: 'desc' },
  });

  return activities.map((a) => ({
    ...a,
    sponsorInstitution: a.Institutions_Activities_sponsorInstitutionIdToInstitutions,
    originalSponsorInstitution: a.Institutions_Activities_originalSponsorInstitutionIdToInstitutions,
    recommendedLevels: a.Levels,
    cores: a.Cores,
    objectives: a.Objectives,
    subObjectives: a.SubObjectives || [],
    curricularObjectives: a.CurricularObjectives || [],
    consequentialCurricularObjectives: a.ConsequentialCurricularObjectives || [],
    creator: a.users_Activities_creatorIdTousers,
    theme: a.ActivitiesThemes,
  }));
}

export const searchActivities = async (queryParams) => {
  const {
    institutionId,
    name,
    recommendedLevels,
    themes,
    cores,
    objectives,
    subObjectives,
    curricularObjectives,
    after, // Cursor: ID of the last item from previous page
    publiclyAvailable,
    openToCommunity,
    userId,
    pageSize = 25,
  } = queryParams;

  // Normalize array parameters - convert strings to arrays
  const normalizeArray = (param) => {
    if (!param) return null;
    if (Array.isArray(param)) return param;
    if (typeof param === 'string') return [param];
    return null;
  };

  const normalizedRecommendedLevels = normalizeArray(recommendedLevels);
  const normalizedThemes = normalizeArray(themes);
  const normalizedCores = normalizeArray(cores);
  const normalizedObjectives = normalizeArray(objectives);
  const normalizedSubObjectives = normalizeArray(subObjectives);
  const normalizedCurricularObjectives = normalizeArray(curricularObjectives);

  const where = {
    deletedAt: null,
  };

  if (institutionId) {
    where.sponsorInstitutionId = institutionId;
  }

  if (userId) {
    where.creatorId = userId;
  }

  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }

  if (normalizedRecommendedLevels && normalizedRecommendedLevels.length > 0) {
    where.Levels = {
      some: { id: { in: normalizedRecommendedLevels } },
    };
  }

  if (normalizedThemes && normalizedThemes.length > 0) {
    where.themeId = { in: normalizedThemes };
  }

  if (normalizedCores && normalizedCores.length > 0) {
    where.Cores = {
      some: { id: { in: normalizedCores } },
    };
  }

  if (normalizedObjectives && normalizedObjectives.length > 0) {
    where.Objectives = {
      some: { id: { in: normalizedObjectives } },
    };
  }

  if (normalizedSubObjectives && normalizedSubObjectives.length > 0) {
    where.SubObjectives = {
      some: { id: { in: normalizedSubObjectives } },
    };
  }

  if (normalizedCurricularObjectives && normalizedCurricularObjectives.length > 0) {
    where.CurricularObjectives = {
      some: { id: { in: normalizedCurricularObjectives } },
    };
  }

  // Normalize boolean parameters
  const normalizeBoolean = (param) => {
    if (param === undefined || param === null) return undefined;
    if (typeof param === 'boolean') return param;
    if (typeof param === 'string') {
      if (param.toLowerCase() === 'true') return true;
      if (param.toLowerCase() === 'false') return false;
    }
    return undefined;
  };

  const normalizedPubliclyAvailable = normalizeBoolean(publiclyAvailable);
  const normalizedOpenToCommunity = normalizeBoolean(openToCommunity);

  if (normalizedPubliclyAvailable !== undefined) {
    where.publiclyAvailable = normalizedPubliclyAvailable;
  }

  if (normalizedOpenToCommunity !== undefined) {
    where.openToCommunity = normalizedOpenToCommunity;
  }

  // Prisma cursor-based pagination
  // Since we order by createdAt DESC, we need to get items that come AFTER the cursor
  // For DESC order: items with createdAt < cursor OR (createdAt = cursor AND id != cursor)
  if (after) {
    // Get the cursor activity to get its createdAt for proper ordering
    const cursorActivity = await prisma.activities.findUnique({
      where: { id: after },
      select: { createdAt: true, id: true },
    });
    
    if (cursorActivity) {
      // Add cursor pagination condition
      // Prisma will AND this with existing where conditions
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { createdAt: { lt: cursorActivity.createdAt } },
            {
              AND: [
                { createdAt: cursorActivity.createdAt },
                { id: { not: after } },
              ],
            },
          ],
        },
      ];
    }
  }

  const activities = await prisma.activities.findMany({
    where,
    include: {
      Institutions_Activities_sponsorInstitutionIdToInstitutions: true,
      users_Activities_creatorIdTousers: true,
      ActivitiesThemes: true,
      Levels: true,
      Cores: true,
      Objectives: {
        include: {
          Cores: true,
        },
      },
      SubObjectives: {
        include: {
          Cores: true,
          Objectives: true,
        },
      },
      CurricularObjectives: {
        include: {
          Cores: true,
        },
      },
      ConsequentialCurricularObjectives: true,
    },
    take: pageSize,
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' }, // Secondary sort for consistent ordering
    ],
  });

  // Return the last item's ID as the next cursor, or null if no more pages
  const nextCursor = activities.length === pageSize ? activities[activities.length - 1].id : null;

  return {
    data: activities.map((a) => ({
      ...a,
      sponsorInstitution: a.Institutions_Activities_sponsorInstitutionIdToInstitutions,
      creator: a.users_Activities_creatorIdTousers,
      theme: a.ActivitiesThemes,
      recommendedLevels: a.Levels,
      cores: a.Cores,
      objectives: (a.Objectives || []).map(obj => ({
        ...obj,
        core: obj.Cores,
      })),
      subObjectives: (a.SubObjectives || []).map(subObj => ({
        ...subObj,
        core: subObj.Cores,
        objective: subObj.Objectives,
      })),
      curricularObjectives: a.CurricularObjectives || [],
      consequentialCurricularObjectives: a.ConsequentialCurricularObjectives || [],
    })),
    after: nextCursor,
  };
}

export const getActivity = async (activityId) => {
  return await fullActivityQuery(activityId);
}

export const getActivitiesByIds = async (activityIds) => {
  const activities = await prisma.activities.findMany({
    where: {
      id: { in: activityIds },
      deletedAt: null,
    },
    include: {
      Institutions_Activities_sponsorInstitutionIdToInstitutions: true,
      users_Activities_creatorIdTousers: true,
      ActivitiesThemes: true,
      Levels: true,
      Cores: true,
      Objectives: true,
      SubObjectives: true,
      CurricularObjectives: {
        include: {
          Cores: true,
        },
      },
      ConsequentialCurricularObjectives: true,
    },
  });

  return activities.map((a) => ({
    ...a,
    sponsorInstitution: a.Institutions_Activities_sponsorInstitutionIdToInstitutions,
    creator: a.users_Activities_creatorIdTousers,
    theme: a.ActivitiesThemes,
    recommendedLevels: a.Levels,
  }));
}

export const countAllActivitiesForUser = async (userId) => {
  const count = await prisma.activities.count({
    where: {
      creatorId: userId,
      deletedAt: null,
    },
  });

  return count;
}
