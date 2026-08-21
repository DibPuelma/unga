import prisma from './prisma';

export const createPendingCard = async ({ userId, registrationToken }) => {
  return prisma.registeredCards.create({
    data: { userId, status: 'pending', registrationToken },
  });
};

export const getCardByRegistrationToken = async (registrationToken) => {
  return prisma.registeredCards.findUnique({ where: { registrationToken } });
};

export const approveCard = async (cardId, { tbkUser, oneclickRegistrationEmail, authorizationCode, cardType, cardNumber }) => {
  const card = await prisma.registeredCards.findUnique({ where: { id: cardId } });

  // A user has at most one active card.
  await prisma.registeredCards.updateMany({
    where: { userId: card.userId, isActive: true },
    data: { isActive: false },
  });

  return prisma.registeredCards.update({
    where: { id: cardId },
    data: {
      status: 'approved',
      tbkUser,
      oneclickRegistrationEmail,
      authorizationCode,
      cardType,
      cardNumber,
      isActive: true,
    },
  });
};

export const rejectCard = async (cardId, errorCode) => {
  return prisma.registeredCards.update({
    where: { id: cardId },
    data: { status: 'rejected', errorCode: String(errorCode), isActive: false },
  });
};

export const getActiveCardForUser = async (userId) => {
  return prisma.registeredCards.findFirst({
    where: { userId, status: 'approved', isActive: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const deactivateCard = async (cardId) => {
  return prisma.registeredCards.update({
    where: { id: cardId },
    data: { isActive: false },
  });
};
