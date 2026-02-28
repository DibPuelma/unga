import { createOpenAIApiCall } from "db/openAIApiCall";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { generatePromptForActivity, suggestActivities } from "services/openai/activities";

export default async (req, res) => {
  const { user: { institution, id: userId } } = await getServerSession(req, res, authOptions);
  const { query: { institutionId, ageMin, ageMax, cores, curricularObjectives, objectives, subObjectives } } = req;
  if ((institution.id !== institutionId)) {
    return res.status(403);
  }

  if (req.method === 'GET') {
    const prompt = generatePromptForActivity({ ageMin, ageMax, cores, curricularObjectives, objectives, subObjectives });
    const response = await suggestActivities(prompt);
    await createOpenAIApiCall({
      ...response.data,
      ...req.query,
      prompt,
      userId,
      relatedCollection: 'Activities',
    });
    res.status(200).json(response.data.choices[0].message.content);
  }
};