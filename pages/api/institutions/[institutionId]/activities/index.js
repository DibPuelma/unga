import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { createActivity, searchActivities } from 'db/activity';

export default async (req, res) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).end();
    }
    const { user: { institution, id: userId } } = session;
  const { query: { institutionId } } = req;
  if ((institution.id !== institutionId)) {
      return res.status(403).end();
  }

  if (req.method == 'POST') {
    const response = await createActivity({ ...req.body, creator: userId, sponsorInstitution: institutionId })
    res.status(200).json(response);
  }

  if (req.method == 'GET') {
    const { query } = req;
    const response = await searchActivities(query);
    res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error in /api/institutions/[institutionId]/activities:', error);
    res.status(500).json({ error: error.message });
  }
};