import prisma from './prisma';

export const createBaseLevelsOfAchievementForInstitution = async (institutionId) => {
  const levelsOfAchievement = [
      {
        name: 'No observado',
        value: 0,
        description: 'Aún no se realizan observaciones para este objetivo',
      institutionId,
      },
      {
        name: 'Por lograr',
        value: 1,
        description: 'El aprendizaje aún no ha sido adquirido',
      institutionId,
      },
      {
        name: 'Medianamente Logrado',
        value: 2,
        description: 'El niño(a) se encuentra en vías de lograr completamente el aprendizaje',
      institutionId,
      },
      {
        name: 'Logrado',
        value: 3,
        description: 'El niño(a) adquirió el aprendizaje',
      institutionId,
      },
  ];

  await prisma.levelsOfAchievement.createMany({
    data: levelsOfAchievement,
  });
};

export const getLevelsOfAchievement = async (institutionId) => {
  const levels = await prisma.levelsOfAchievement.findMany({
    where: { institutionId },
    orderBy: { value: 'asc' },
  });

  return levels;
}

export const updateLevelOfAchievement = async (id, data) => {
  const level = await prisma.levelsOfAchievement.update({
    where: { id },
    data,
  });

  return level;
}
