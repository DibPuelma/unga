import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getNonHeterogeneousLevels } from "db/level";

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401);
  if (req.method == 'GET') {
    const levels = await getNonHeterogeneousLevels();
    res.status(200).json(levels);
  }
};