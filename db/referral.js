import prisma from './prisma';

export const statusToSpanish = {
  registered: 'Registrado',
  trialPeriod: 'En periodo de prueba',
  payedPlan: 'Pagó su plan',
  amountPayedToReferrer: 'Recibiste la plata',
}

export const createReferral = async ({ referrerEmail, referredUserId }) => {
  const referrer = await prisma.user.findUnique({
    where: { email: referrerEmail },
  });

  if (!referrer) throw new Error('Referrer not found');

  const referral = await prisma.referrals.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
      status: 'registered',
      amountPaid: 0,
      amountToPay: 5000,
    },
    include: {
      referrer: true,
      referred: true,
    },
  });

  return referral;
}

export const updateReferralStatusQuery = async (referralId, newStatus) => {
  return await prisma.referrals.update({
    where: { id: referralId },
    data: { status: newStatus },
  });
}

export const updateReferral = async (referralId, newStatus) => {
  const referral = await prisma.referrals.update({
    where: { id: referralId },
    data: { status: newStatus },
  });

  return referral;
}

export const getReferralOfUserQuery = async (userId) => {
  const referral = await prisma.referrals.findFirst({
    where: { referredId: userId },
  });

  return referral;
}

export const getReferralOfUser = async (userId) => {
  return await getReferralOfUserQuery(userId);
}

export const getUserReferrals = async (id) => {
  const referrals = await prisma.referrals.findMany({
    where: { referrerId: id },
    include: {
      referred: true,
    },
    take: 1000,
  });

  return referrals.map((r) => ({
    ...r,
    referred: r.referred,
  }));
}

export const getAllReferrals = async () => {
  const referrals = await prisma.referrals.findMany({
    include: {
      referrer: true,
      referred: true,
    },
  });

  return referrals.map((r) => ({
    ...r,
    referrer: r.referrer,
    referred: r.referred,
  }));
}
