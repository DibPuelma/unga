import prisma from './prisma';

export const createActivityReview = async (data) => {
  const review = await prisma.activityReview.create({
    data: {
      activityId: data.activityId,
      rating: data.rating || null,
      comment: data.comment || null,
    },
    include: {
      activity: true,
    },
  });

  return review;
}

export const getActivityReviews = async (activityId) => {
  const reviews = await prisma.activityReview.findMany({
    where: { activityId },
    include: {
      activity: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews;
}
