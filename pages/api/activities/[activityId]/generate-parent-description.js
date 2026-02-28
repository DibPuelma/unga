import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { generateParentDescriptionForActivity } from "db/activity";

export default async (req, res) => {
  const { user: { role } } = await getServerSession(req, res, authOptions);

  if (role !== 'superAdmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'PATCH') {
    const { query: { activityId } } = req;
    try {
      const query = await generateParentDescriptionForActivity(activityId)
      return res.status(200).json(query);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
};