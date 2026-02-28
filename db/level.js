import prisma from './prisma';

export const HETEROGENEOUS_TO_NON_HETEROGENEUS = {
  'Sala Cuna Heterogéneo': ['Sala Cuna Menor', 'Sala Cuna Mayor'],
  'Nivel Medio Heterogéneo': ['Nivel Medio Menor', 'Nivel Medio Mayor'],
  'Nivel Transición Heterogéneo': ['Primer Nivel Transición', 'Segundo Nivel Transición'],
}

export const getLevels = async () => {
  const levels = await prisma.levels.findMany();

  return levels;
};

export const getNonTemporalLevels = async () => {
  const levels = await getLevels();
  return levels.filter((level) => !level.name.includes('temporal'));
}

export const getNonHeterogeneousLevels = async () => {
  const levels = await getNonTemporalLevels();
  return levels.filter((level) => !level.name.includes('Heterogéneo'))
}

export const getInstitutionLevels = async (institutionId) => {
  const classrooms = await prisma.classes.findMany({
    where: {
      institutionId,
      deletedAt: null,
    },
    include: {
      Levels: true,
    },
    distinct: ['levelId'],
  });

  const levels = classrooms.map((c) => c.Levels);
  return levels;
}

export const getLevelsWithoutHeterogeneous = async () => {
  const levels = await getLevels();
  return levels.filter((level) => !level.name.includes('Heterogéneo'))
}

export const getLevelForClassroom = async (classroomId) => {
  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    include: {
      Levels: true,
    },
  });

  if (!classroom) return null;

  return classroom.Levels;
}
