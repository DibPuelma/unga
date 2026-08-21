import prisma from './prisma';

export const getActiveSubscriptionForUser = async (userId) => {
  return prisma.subscriptions.findFirst({
    where: { userId, status: { in: ['active', 'payment_failed'] } },
    orderBy: { createdAt: 'desc' },
  });
};

export const createSubscription = async (data) => {
  return prisma.subscriptions.create({ data });
};

export const updateSubscription = async (id, data) => {
  return prisma.subscriptions.update({ where: { id }, data });
};

export const getSubscriptionsDueForRenewal = async (now = new Date()) => {
  return prisma.subscriptions.findMany({
    where: { status: 'active', currentPeriodEnd: { lte: now } },
    include: { users: true, RegisteredCards: true },
  });
};

export const getSubscriptionsDueForRetry = async (now = new Date()) => {
  return prisma.subscriptions.findMany({
    where: { status: 'payment_failed', nextRetryAt: { lte: now } },
    include: { users: true, RegisteredCards: true },
  });
};
