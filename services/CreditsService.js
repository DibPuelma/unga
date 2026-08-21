import {
  consumeCredit,
  refundCredit,
  grantSignupCredits,
  grantMonthlyCredits,
  grantExtraCredits,
  getCreditBalances,
  countRecentConsumes,
  InsufficientCreditsError,
} from 'db/credits';
import { isB2CPlan } from 'src/helpers/plans';

export { InsufficientCreditsError };

export default class CreditsService {
  // B2B teachers and superAdmins generate without consuming credits.
  static isExempt(user) {
    return user?.role === 'superAdmin' || (user?.plan && !isB2CPlan(user.plan));
  }

  static async consumeForUser(user, relatedId) {
    if (this.isExempt(user)) return null;
    return consumeCredit(user.id, relatedId);
  }

  static async refundForUser(user, relatedId) {
    if (this.isExempt(user)) return null;
    return refundCredit(user.id, relatedId);
  }

  static async grantSignupCredits(userId) {
    return grantSignupCredits(userId);
  }

  static async grantMonthlyCredits(userId, paymentId) {
    return grantMonthlyCredits(userId, paymentId);
  }

  static async grantExtraCredits(userId, credits, paymentId) {
    return grantExtraCredits(userId, credits, paymentId);
  }

  static async getCreditsForUser(userId) {
    const balances = await getCreditBalances(userId);
    if (!balances) return null;
    return {
      monthlyCredits: balances.monthlyCredits,
      extraCredits: balances.extraCredits,
      remaining: balances.monthlyCredits + balances.extraCredits,
      plan: balances.plan,
    };
  }

  // Coarse per-user rate limit for AI generation, counted off the ledger.
  static async isRateLimited(userId, { perMinute = 3, perHour = 30 } = {}) {
    const now = Date.now();
    const lastMinute = await countRecentConsumes(userId, new Date(now - 60 * 1000));
    if (lastMinute >= perMinute) return true;
    const lastHour = await countRecentConsumes(userId, new Date(now - 60 * 60 * 1000));
    return lastHour >= perHour;
  }
}
