import prisma from './prisma';

export const createActivityTheme = async (name) => {
  const theme = await prisma.activitiesThemes.create({
    data: { name },
  });

  return theme;
}

export const getActivityThemes = async () => {
  const themes = await prisma.activitiesThemes.findMany({
    orderBy: { name: 'asc' },
  });

  return themes;
}
