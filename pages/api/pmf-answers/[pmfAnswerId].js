import { updatePMFAnswer } from "db/pmfAnswer";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  if (!user) return res.status(403).end();

  const { query: { pmfAnswerId } } = req;
  if (req.method === 'PATCH') {
    const answer = await updatePMFAnswer(pmfAnswerId, { ...req.body });
    res.status(200).json(answer);
  }
};