export default function usePlans() {
  const allPlans = ['trial', 'individualStart', 'individualGrow', 'individualStandOut', 'institutional', 'parentsBase'];
  const plansFromIndividualGrow = ['trial', 'individualGrow', 'individualStandOut', 'institutional'];
  const plansFromIndividualStandOut = ['trial', 'individualStandOut', 'institutional'];

  return {
    allPlans,
    plansFromIndividualGrow,
    plansFromIndividualStandOut,
  }
}