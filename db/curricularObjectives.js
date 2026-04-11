import prisma from './prisma';

const COUNTRY_ALIASES = {
  cl: ['cl', 'chile'],
  chile: ['cl', 'chile'],
  mx: ['mx', 'mexico', 'méxico'],
  mexico: ['mx', 'mexico', 'méxico'],
  'méxico': ['mx', 'mexico', 'méxico'],
};

const getCountryVariants = (country) => {
  if (!country) return [];
  const normalizedCountry = String(country).trim().toLowerCase();
  const aliases = COUNTRY_ALIASES[normalizedCountry] || [normalizedCountry];
  return [...new Set(aliases)];
};

export const getCurricularObjectivesByCountry = async (country, institutionId) => {
  const countryVariants = getCountryVariants(country);
  const whereClause = {
    institutionId,
  };

  if (countryVariants.length > 0) {
    whereClause.country = { in: countryVariants };
  }

  const objectives = await prisma.curricularObjectives.findMany({
    where: whereClause,
    include: {
      Levels: true,
      Cores: true,
    },
    take: 250,
  });

  return objectives.map((obj) => ({
    ...obj,
    levels: obj.Levels,
    core: obj.Cores,
  }));
}

export const getCurricularObjectivesByCountryAndMethodology = async (country, methodology, institutionId) => {
  const countryVariants = getCountryVariants(country);
  const whereClause = {
    methodology,
    institutionId,
  };

  if (countryVariants.length > 0) {
    whereClause.country = { in: countryVariants };
  }

  const objectives = await prisma.curricularObjectives.findMany({
    where: whereClause,
    include: {
      Levels: true,
      Cores: true,
    },
    take: 250,
  });

  return objectives.map((obj) => ({
    ...obj,
    levels: obj.Levels,
    core: obj.Cores,
  }));
}

export const getCurricularObjectiveByName = async (name, institutionId) => {
  // Simple name search - can be enhanced with ngram search if needed
  const objective = await prisma.curricularObjectives.findFirst({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
      institutionId,
    },
    include: {
      Levels: true,
      Cores: true,
    },
  });

  return objective ? {
    ...objective,
    levels: objective.Levels,
    core: objective.Cores,
  } : null;
}

export const getCurricularObjectivesByInstitution = async (institutionId) => {
  const objectives = await prisma.curricularObjectives.findMany({
    where: { institutionId },
    include: {
      Levels: true,
      Cores: true,
    },
    take: 250,
  });

  return objectives.map((obj) => ({
    ...obj,
    levels: obj.Levels,
    core: obj.Cores,
  }));
}

export const getCurricularObjectivesForCores = async (coreIds, levelIds = null) => {
  // Get curricular objectives that belong directly to the specified cores
  const whereClause = {
    coreId: { in: coreIds },
  };

  // If levelIds are provided, filter by level
  if (levelIds && levelIds.length > 0) {
    whereClause.Levels = {
      some: { id: { in: levelIds } },
    };
  }

  const curricularObjectives = await prisma.curricularObjectives.findMany({
    where: whereClause,
    include: {
      Levels: true,
      Cores: true,
    },
  });

  return curricularObjectives.map((co) => ({
    ...co,
    levels: co.Levels,
    core: co.Cores,
  }));
}

export const deleteCurricularObjective = async (curricularObjectiveId) => {
  await prisma.objectives.updateMany({
    where: { curricularObjectiveId },
    data: { curricularObjectiveId: null },
  });

  await prisma.subObjectives.updateMany({
    where: { curricularObjectiveId },
    data: { curricularObjectiveId: null },
  });

  const deleted = await prisma.curricularObjectives.delete({
    where: { id: curricularObjectiveId },
  });

  return deleted;
}

export const getCurricularObjectivesByCore = async (coreId) => {
  const objectives = await prisma.curricularObjectives.findMany({
    where: { coreId },
    include: {
      Levels: true,
      Cores: true,
    },
    orderBy: { name: 'asc' },
  });

  return objectives.map((obj) => ({
    ...obj,
    levels: obj.Levels,
    core: obj.Cores,
  }));
}
