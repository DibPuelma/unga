import prisma from './prisma';

export const createConsequentialCurricularObjective = async (data) => {
  const { institutionId, ...rest } = data;
  const consequential = await prisma.consequentialCurricularObjectives.create({
    data: rest,
    include: {
      CurricularObjectives: true,
    },
  });

  return consequential;
}

export const getConsequentialCurricularObjectives = async (institutionId) => {
  // Filter consequential curricular objectives by ensuring their referenced curricular objectives belong to the institution
  const objectives = await prisma.consequentialCurricularObjectives.findMany({
    where: {
      CurricularObjectives: {
        institutionId: institutionId,
      },
    },
    include: {
      CurricularObjectives: true,
    },
    orderBy: { name: 'asc' },
  });

  return objectives.map((obj) => ({
    ...obj,
    curricularObjective: obj.CurricularObjectives,
  }));
}
