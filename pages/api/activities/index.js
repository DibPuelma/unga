import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { searchActivities } from 'db/activity';

export default async (req, res) => {
  try {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(403).end();
  }

  if (req.method == 'GET') {
    const { query } = req;
    if (query.institutionId || (!query.publiclyAvailable && !query.openToCommunity)) return res.status(400).end();

    const response = await searchActivities(query);
    res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error in /api/activities:', error);
    res.status(500).json({ error: error.message });
  }
};