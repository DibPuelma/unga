import moment from 'moment-timezone';
import prisma from 'db/prisma';
import { authorizeCharge, getResponseCodeMessage } from 'services/transbank/oneclick';
import { createPayment } from 'db/payment';
import {
  createSubscription,
  getActiveSubscriptionForUser,
  getSubscriptionsDueForRenewal,
  getSubscriptionsDueForRetry,
  updateSubscription,
} from 'db/subscription';
import CreditsService from 'services/CreditsService';
import { SUBSCRIPTION_PRICE_CLP, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_CLP } from 'src/helpers/plans';
import SendSubscriptionSlackMessage from 'commands/slack/SendSubscriptionSlackMessage';

const TIMEZONE = 'America/Santiago';
const MIN_CHARGE_CLP = 50;
const MAX_RETRIES = 3;
const RETRY_DELAYS_DAYS = { 1: 3, 2: 4 };

const buyOrder = (prefix) => {
  // ≤26 chars: PREFIX + 10-digit epoch-seconds + 4 random.
  const ts = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${ts}${rand}`;
};

export const nextFirstOfMonth = (from = moment.tz(TIMEZONE)) =>
  from.clone().add(1, 'month').startOf('month').toDate();

// First charge is prorated to the days left in the current month; subscribing
// on the 1st pays the full price.
export const proratedFirstAmount = (now = moment.tz(TIMEZONE)) => {
  const dayOfMonth = now.date();
  if (dayOfMonth === 1) return SUBSCRIPTION_PRICE_CLP;
  const daysInMonth = now.daysInMonth();
  const daysRemaining = daysInMonth - dayOfMonth + 1;
  return Math.max(MIN_CHARGE_CLP, Math.round((SUBSCRIPTION_PRICE_CLP * daysRemaining) / daysInMonth));
};

export class ChargeRejectedError extends Error {
  constructor(responseCode) {
    super(`Charge rejected with code ${responseCode}`);
    this.name = 'ChargeRejectedError';
    this.responseCode = responseCode;
    this.userMessage = getResponseCodeMessage(responseCode);
  }
}

const chargeCard = async ({ card, amount, order }) => {
  const result = await authorizeCharge({
    username: card.oneclickRegistrationEmail,
    tbkUser: card.tbkUser,
    buyOrder: order,
    amount,
  });
  if (result.responseCode !== 0) throw new ChargeRejectedError(result.responseCode);
  return result;
};

export default class SubscriptionService {
  // Called right after a card inscription is approved with intent=subscribe.
  static async activateSubscription(user, card) {
    const existing = await getActiveSubscriptionForUser(user.id);
    if (existing) return existing;

    const now = moment.tz(TIMEZONE);
    const amount = proratedFirstAmount(now);
    const order = buyOrder('SUB');

    const charge = await chargeCard({ card, amount, order });

    const subscription = await createSubscription({
      userId: user.id,
      status: 'active',
      registeredCardId: card.id,
      amount: SUBSCRIPTION_PRICE_CLP,
      currentPeriodEnd: nextFirstOfMonth(now),
    });

    const payment = await createPayment({
      userId: user.id,
      subscriptionId: subscription.id,
      type: 'subscription_first',
      buyOrder: order,
      status: 'approved',
      amount,
      authorizationCode: charge.authorizationCode,
      responseCode: 0,
      raw: charge.raw,
    });

    await prisma.users.update({
      where: { id: user.id },
      data: { plan: 'unga', paymentStartedAt: new Date(), planCanceledAt: null },
    });
    await CreditsService.grantMonthlyCredits(user.id, payment.id);

    new SendSubscriptionSlackMessage({ user, event: 'new', amount }).perform();

    return subscription;
  }

  static async purchaseCreditPack(user, card, packs) {
    const amount = packs * CREDIT_PACK_PRICE_CLP;
    const credits = packs * CREDIT_PACK_SIZE;
    const order = buyOrder('PACK');

    const charge = await chargeCard({ card, amount, order });

    const payment = await createPayment({
      userId: user.id,
      type: 'credit_pack',
      buyOrder: order,
      status: 'approved',
      amount,
      authorizationCode: charge.authorizationCode,
      responseCode: 0,
      creditsGranted: credits,
      raw: charge.raw,
    });

    await CreditsService.grantExtraCredits(user.id, credits, payment.id);

    return { payment, creditsGranted: credits };
  }

  static async cancelAtPeriodEnd(userId) {
    const subscription = await getActiveSubscriptionForUser(userId);
    if (!subscription) return null;
    return updateSubscription(subscription.id, { cancelAtPeriodEnd: true });
  }

  // Undoes a pending cancellation. Only works before the period actually
  // ends (i.e. while the subscription is still active/payment_failed) —
  // once #finalizeCancellation runs, the user must subscribe again.
  static async resumeSubscription(userId) {
    const subscription = await getActiveSubscriptionForUser(userId);
    if (!subscription || !subscription.cancelAtPeriodEnd) return null;
    return updateSubscription(subscription.id, { cancelAtPeriodEnd: false });
  }

  static async #finalizeCancellation(subscription) {
    await updateSubscription(subscription.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      nextRetryAt: null,
    });
    await prisma.users.update({
      where: { id: subscription.userId },
      data: { plan: 'free', planCanceledAt: new Date(), monthlyCredits: 0 },
    });
    new SendSubscriptionSlackMessage({ user: subscription.users, event: 'cancelled' }).perform();
  }

  static async #renewOne(subscription) {
    if (subscription.cancelAtPeriodEnd) {
      await this.#finalizeCancellation(subscription);
      return { outcome: 'cancelled' };
    }

    const card = subscription.RegisteredCards;
    if (!card?.tbkUser) {
      await this.#handleFailure(subscription, 'missing_card');
      return { outcome: 'failed' };
    }

    const order = buyOrder('REN');
    try {
      const charge = await chargeCard({ card, amount: subscription.amount, order });
      const payment = await createPayment({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        type: 'subscription_renewal',
        buyOrder: order,
        status: 'approved',
        amount: subscription.amount,
        authorizationCode: charge.authorizationCode,
        responseCode: 0,
        raw: charge.raw,
      });
      await updateSubscription(subscription.id, {
        status: 'active',
        currentPeriodEnd: nextFirstOfMonth(),
        retryCount: 0,
        nextRetryAt: null,
        paymentFailureReason: null,
      });
      await prisma.users.update({
        where: { id: subscription.userId },
        data: { plan: 'unga' },
      });
      await CreditsService.grantMonthlyCredits(subscription.userId, payment.id);
      return { outcome: 'renewed' };
    } catch (e) {
      const reason = e instanceof ChargeRejectedError ? `code_${e.responseCode}` : e.message;
      await createPayment({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        type: 'subscription_renewal',
        buyOrder: order,
        status: 'rejected',
        amount: subscription.amount,
        responseCode: e.responseCode ?? null,
        raw: { error: reason },
      }).catch(() => {});
      await this.#handleFailure(subscription, reason);
      return { outcome: 'failed' };
    }
  }

  static async #handleFailure(subscription, reason) {
    const newRetryCount = (subscription.retryCount || 0) + 1;
    if (newRetryCount >= MAX_RETRIES) {
      await this.#finalizeCancellation(subscription);
      return;
    }
    const delayDays = RETRY_DELAYS_DAYS[newRetryCount] || 3;
    await updateSubscription(subscription.id, {
      status: 'payment_failed',
      retryCount: newRetryCount,
      nextRetryAt: moment.tz(TIMEZONE).add(delayDays, 'days').toDate(),
      paymentFailureReason: reason,
    });
    new SendSubscriptionSlackMessage({
      user: subscription.users,
      event: 'payment_failed',
      detail: `intento ${newRetryCount}/${MAX_RETRIES}`,
    }).perform();
  }

  static async chargeRenewals() {
    const due = await getSubscriptionsDueForRenewal();
    const results = { renewed: 0, failed: 0, cancelled: 0 };
    for (const subscription of due) {
      const { outcome } = await this.#renewOne(subscription);
      results[outcome] += 1;
    }
    return { processed: due.length, ...results };
  }

  static async retryFailed() {
    const due = await getSubscriptionsDueForRetry();
    const results = { renewed: 0, failed: 0, cancelled: 0 };
    for (const subscription of due) {
      const { outcome } = await this.#renewOne(subscription);
      results[outcome] += 1;
    }
    return { processed: due.length, ...results };
  }
}
