import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getActivityThemes } from 'db/activitiesThemes';

export default async (req, res) => {
  try {
  const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();
  if (req.method == 'GET') {
      const themes = await getActivityThemes();
    res.status(200).json(themes);
    }
  } catch (error) {
    console.error('Error in /api/themes:', error);
    res.status(500).json({ error: error.message });
  }
};