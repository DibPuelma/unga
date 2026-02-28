import prisma from './prisma';

export const getTutorials = async () => {
  const tutorials = await prisma.tutorial.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return tutorials;
}
