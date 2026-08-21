import { ALL_PLANS, B2C_PLANS, INSTITUTIONAL_ONLY, PLANS_WITH_PLANNING, isB2CPlan } from 'src/helpers/plans';

export default function usePlans() {
  return {
    allPlans: ALL_PLANS,
    b2cPlans: B2C_PLANS,
    isB2C: (plan) => isB2CPlan(plan),
    plansWithPlanning: PLANS_WITH_PLANNING,
    // Interim aliases: classroom tools (observations, evaluations, reports,
    // attendance) are institutional-only in the B2C rework. Components still
    // reading the legacy names keep compiling and correctly lock B2C users out.
    plansFromIndividualGrow: INSTITUTIONAL_ONLY,
    plansFromIndividualStandOut: INSTITUTIONAL_ONLY,
  }
}
