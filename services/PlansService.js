import { GROW_FEATURES, STAND_OUT_FEATURES, START_FEATURES } from "db/feature";
import { updateUser, endExpiredTrialsForUsers, getUsersWithTrialsEndingSoon } from "db/user";
import { sendTrialEndingReminders } from "./email/users";
import { getReferralOfUser, updateReferral } from "db/referral";

export default class PlansService {
  static ALL_PLANS = ['trial', 'individualStart', 'individualGrow', 'individualStandOut', 'institutional', 'parentsBase'];
  static plansFromIndividualGrow = ['trial', 'individualGrow', 'individualStandOut', 'institutional'];
  static plansFromIndividualStandOut = ['trial', 'individualStandOut', 'institutional'];
  static individualPlans = ['individualStart', 'individualGrow', 'individualStandOut', 'trial'];
  static individualPayingPlans = ['individualStart', 'individualGrow', 'individualStandOut'];
  static async startFreeTrial(user, futurePlan) {
    const safePlan = this.getSafePlan(futurePlan);
    const referral = await getReferralOfUser(user.id);
    if (referral) await updateReferral(referral.id, 'trialPeriod');
    await updateUser(user.id, { selectedFreeTrialPlan: safePlan, freeTrialStarted: true })
  }

  static async sendTrialEndingReminders() {
    const users = await getUsersWithTrialsEndingSoon();
    sendTrialEndingReminders(users);
  }

  static getSafePlan(plan) {
    const allowedPlans = ['individualStart', 'individualGrow', 'individualStandOut', 'parentsBase']
    if (allowedPlans.includes(plan)) return plan;
    return 'trial';
  }

  static getFeatures(plan) {
    switch (plan) {
      case 'individualStart':
        return START_FEATURES;
      case 'individualGrow':
        return GROW_FEATURES;
      case 'individualStandOut':
        return STAND_OUT_FEATURES;
      default:
        return [];
    }
  }

  static async endExpiredTrials() {
    await endExpiredTrialsForUsers();
  }
}