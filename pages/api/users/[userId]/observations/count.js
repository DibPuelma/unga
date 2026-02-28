import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { countObservationsForTeacher } from "db/observation";

export default async (req, res) => {
  const { query: { userId } } = req;
  const { user } = await getServerSession(req, res, authOptions);

  if (user.id !== userId) return res.status(403).end();

  if (req.method === 'GET') {
    try {
      const query = await countObservationsForTeacher(userId);
      return res.status(200).json(query);
    } catch (e) {
      console.error(e);
      return res.status(400).end();
    }
  }
};