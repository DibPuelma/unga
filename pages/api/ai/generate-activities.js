import { createActivity, searchActivities } from "db/activity";
import { getCores } from "db/core";
import { getNonHeterogeneousLevels } from "db/level";
import { createOpenAIApiCall } from "db/openAIApiCall";
import _ from "lodash";
import { generateNewActivityFromOthers, generatePromptBasedOnActivitiesIds } from "services/openai/activities";
import { isJsonString } from "src/helpers/strings";

export default async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  if (apiKey !== process.env.UNGA_INTERNAL_API_KEY && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const UNGA_EXPERIENCES_INSTITUTION_ID = process.env.UNGA_EXPERIENCES_INSTITUTION_ID;
  const UNGA_EXPERIENCES_USER_ID = process.env.UNGA_EXPERIENCES_USER_ID;

  if (req.method === 'GET') {
    const cores = await getCores(UNGA_EXPERIENCES_INSTITUTION_ID);
    const transversalCores = cores.filter((core) => core.type === 'transversal');
    const specificCores = cores.filter((core) => core.type === 'specific');
    const chosenTransversalCore = transversalCores[Math.floor(Math.random() * transversalCores.length)];
    const chosenSpecificCore = specificCores[Math.floor(Math.random() * specificCores.length)];

    const levels = await getNonHeterogeneousLevels();
    const startingAges = [0, 2, 4]
    const selectedStartingAge = startingAges[Math.floor(Math.random() * startingAges.length)];
    const selectedAgesRange = [selectedStartingAge, selectedStartingAge + 2];
    const selectedLevels = levels.filter((level) => level.ageFrom >= selectedAgesRange[0] && level.ageUpTo <= selectedAgesRange[1]);
    const selectedCores = [chosenTransversalCore, chosenSpecificCore];
    const activities = await searchActivities({
      institutionId: UNGA_EXPERIENCES_INSTITUTION_ID,
      recommendedLevels: selectedLevels.map((level) => level.id).join(','),
      cores: selectedCores.map((core) => core.id).join(','),
      pageSize: 100,
      coresFiltering: 'INTERSECTION',
    });

    const activitiesIds = _.sampleSize(activities, 3).map((activity) => activity.id);
    const prompt = await generatePromptBasedOnActivitiesIds(activitiesIds);
    const newActivity = await generateNewActivityFromOthers(prompt);
    const activityData = newActivity.content;

    const createActivityPayload = {
      sponsorInstitution: UNGA_EXPERIENCES_INSTITUTION_ID,
      creator: UNGA_EXPERIENCES_USER_ID,
      recommendedLevels: selectedLevels.map((level) => level.id),
      cores: [chosenTransversalCore.id, chosenSpecificCore.id],
      transversalCores: [chosenTransversalCore.id],
      specificCores: [chosenSpecificCore.id],
      coresNames: [chosenTransversalCore.name, chosenSpecificCore.name],
      fromSuggestion: true,
      publiclyAvailable: true,
    }

    if (isJsonString(activityData)) {
      const { name, description, specificCurricularObjectives, transversalCurricularObjectives } = JSON.parse(activityData);
      createActivityPayload.name = name;
      createActivityPayload.description = description;
      createActivityPayload.specificCurricularObjectivesNames = specificCurricularObjectives;
      createActivityPayload.transversalCurricularObjectivesNames = transversalCurricularObjectives;
    } else {
      createActivityPayload.name = 'Experiencia de aprendizaje sugerida';
      createActivityPayload.description = activityData;
    }

    const createdActivity = await createActivity(createActivityPayload)

    await createOpenAIApiCall({
      createdActivityId: createdActivity.id,
      response: newActivity.content,
      model: newActivity.model,
      tokensUsed: newActivity.usage?.total_tokens,
      prompt,
      userId: UNGA_EXPERIENCES_USER_ID,
      internalAPICall: true,
      relatedCollection: 'Activities',
      activitiesIds,
      selectedLevels: selectedLevels.map((level) => ({ name: level.name, id: level.id })),
      selectedCores: selectedCores.map((core) => ({ name: core.name, id: core.id })),
    });

    return res.status(200).json(createdActivity);
  }
};