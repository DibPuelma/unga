import { idMapper } from "./parsers";

export const prepareActivityForForm = (activity) => {
  if (!activity) return null;

  const preparedActivity = { ...activity, id: activity.id };
  delete preparedActivity.cores;
  delete preparedActivity.createdAt;
  delete preparedActivity.creator;
  delete preparedActivity.objectives;
  delete preparedActivity.subObjectives;
  delete preparedActivity.curricularObjectives;
  preparedActivity.recommendedLevels = activity.recommendedLevels?.map(idMapper) || [];
  preparedActivity.specificCores = activity.specificCores?.map(idMapper) || [];
  preparedActivity.transversalCores = activity.transversalCores?.map(idMapper) || [];
  preparedActivity.specificObjectives = activity.specificObjectives?.map(idMapper) || [];
  preparedActivity.transversalObjectives = activity.transversalObjectives?.map(idMapper) || [];
  preparedActivity.specificCurricularObjectives = activity.specificCurricularObjectives?.map(idMapper) || [];
  preparedActivity.transversalCurricularObjectives = activity.transversalCurricularObjectives?.map(idMapper) || [];
  preparedActivity.specificSubObjectives = activity.specificSubObjectives?.map(idMapper) || [];
  preparedActivity.transversalSubObjectives = activity.transversalSubObjectives?.map(idMapper) || [];
  preparedActivity.consequentialCurricularObjectives = activity.consequentialCurricularObjectives?.map(idMapper) || [];
  preparedActivity.sponsorInstitution = activity.sponsorInstitution?.id || '';
  preparedActivity.theme = activity.theme?.id || '';
  preparedActivity.ideaOrigin = activity.ideaOrigin || '';

  return preparedActivity;
}