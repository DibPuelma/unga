import { createOpenAIApiCall } from "db/openAIApiCall";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { generatePromptBasedOnActivitiesIds, suggestActivities } from "services/openai/activities";
import { getInstitution } from "db/institution";

export default async (req, res) => {
  const { user: { id: userId, institution } } = await getServerSession(req, res, authOptions);
  const { query: { 'activitiesIds[]': activitiesIds } } = req;
  const institutionDoc = await getInstitution(institution.id)
  if (!institutionDoc.features?.includes('createActivitiesFromAI')) {
    return res.status(403);
  }

  if (req.method === 'GET') {
    const prompt = await generatePromptBasedOnActivitiesIds(activitiesIds);
    const response = await suggestActivities(prompt);
    await createOpenAIApiCall({
      ...response.data,
      ...req.query,
      prompt,
      userId,
      relatedCollection: 'Activities',
    });
    return res.status(200).json(response.data.choices[0].message.content);
  }
};