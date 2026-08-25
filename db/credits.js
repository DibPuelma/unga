import prisma from './prisma';
import { MONTHLY_CREDITS, SIGNUP_CREDITS } from 'src/helpers/plans';

export class InsufficientCreditsError extends Error {
  constructor() {
    super('No credits available');
    this.name = 'InsufficientCreditsError';
    this.code = 'NO_CREDITS';
  }
}

const currentBalances = async (tx, userId) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { monthlyCredits: true, extraCredits: true },
  });
  return user;
};

// Race-safe: the conditional updateMany is an atomic UPDATE, so two concurrent
// requests can never spend the same last credit. Monthly credits are spent
// before extra (purchased) ones.
export const consumeCredit = async (userId, relatedId) => {
  return prisma.$transaction(async (tx) => {
    let bucket = 'monthly';
    let updated = await tx.user.updateMany({
      where: { id: userId, monthlyCredits: { gte: 1 } },
      data: { monthlyCredits: { decrement: 1 } },
    });

    if (updated.count === 0) {
      bucket = 'extra';
      updated = await tx.user.updateMany({
        where: { id: userId, extraCredits: { gte: 1 } },
        data: { extraCredits: { decrement: 1 } },
      });
    }

    if (updated.count === 0) throw new InsufficientCreditsError();

    const balances = await currentBalances(tx, userId);
    await tx.creditTransactions.create({
      data: {
        userId,
        amount: -1,
        bucket,
        reason: 'consume',
        balanceAfter: balances.monthlyCredits + balances.extraCredits,
        relatedId,
      },
    });

    return balances;
  });
};

// Idempotent by the [relatedId, reason] unique constraint: refunding the same
// generation twice is a no-op.
export const refundCredit = async (userId, relatedId) => {
  const consumed = await prisma.creditTransactions.findUnique({
    where: { relatedId_reason: { relatedId, reason: 'consume' } },
  });
  if (!consumed) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      const field = consumed.bucket === 'extra' ? 'extraCredits' : 'monthlyCredits';
      await tx.user.update({
        where: { id: userId },
        data: { [field]: { increment: 1 } },
      });
      const balances = await currentBalances(tx, userId);
      await tx.creditTransactions.create({
        data: {
          userId,
          amount: 1,
          bucket: consumed.bucket,
          reason: 'refund',
          balanceAfter: balances.monthlyCredits + balances.extraCredits,
          relatedId,
        },
      });
      return balances;
    });
  } catch (e) {
    if (e.code === 'P2002') return null; // already refunded
    throw e;
  }
};

// Idempotent per user (relatedId = userId): the free trial is exactly one
// grant of 5 credits at signup, no card and no dates involved.
export const grantSignupCredits = async (userId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.creditTransactions.create({
        data: {
          userId,
          amount: SIGNUP_CREDITS,
          bucket: 'monthly',
          reason: 'signup_grant',
          balanceAfter: SIGNUP_CREDITS,
          relatedId: userId,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { monthlyCredits: SIGNUP_CREDITS },
      });
    });
  } catch (e) {
    if (e.code === 'P2002') return null; // already granted
    throw e;
  }
};

// Absolute set: monthly credits reset on each billing cycle (they don't
// accumulate); extra credits are untouched. relatedId (payment id) makes the
// grant idempotent against double-charging bugs.
export const grantMonthlyCredits = async (userId, relatedId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await currentBalances(tx, userId);
      await tx.user.update({
        where: { id: userId },
        data: { monthlyCredits: MONTHLY_CREDITS },
      });

      if (before.monthlyCredits > 0) {
        await tx.creditTransactions.create({
          data: {
            userId,
            amount: -before.monthlyCredits,
            bucket: 'monthly',
            reason: 'reset_forfeit',
            balanceAfter: before.extraCredits,
            relatedId,
          },
        });
      }

      await tx.creditTransactions.create({
        data: {
          userId,
          amount: MONTHLY_CREDITS,
          bucket: 'monthly',
          reason: 'monthly_grant',
          balanceAfter: MONTHLY_CREDITS + before.extraCredits,
          relatedId,
        },
      });
    });
  } catch (e) {
    if (e.code === 'P2002') return null; // this payment already granted credits
    throw e;
  }
};

export const grantExtraCredits = async (userId, credits, relatedId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { extraCredits: { increment: credits } },
      });
      const balances = await currentBalances(tx, userId);
      await tx.creditTransactions.create({
        data: {
          userId,
          amount: credits,
          bucket: 'extra',
          reason: 'pack_purchase',
          balanceAfter: balances.monthlyCredits + balances.extraCredits,
          relatedId,
        },
      });
      return balances;
    });
  } catch (e) {
    if (e.code === 'P2002') return null; // this payment already granted credits
    throw e;
  }
};

export const getCreditBalances = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyCredits: true, extraCredits: true, plan: true },
  });
};

export const countRecentConsumes = async (userId, since) => {
  return prisma.creditTransactions.count({
    where: { userId, reason: 'consume', createdAt: { gte: since } },
  });
};
