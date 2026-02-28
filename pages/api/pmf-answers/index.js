import { createPMFAnswer, getThisMonthPMFAnswer } from "db/pmfAnswer";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).end();

  const { user: { id } } = session;
  if (req.method === 'GET') {
    const answer = await getThisMonthPMFAnswer(id);
    res.status(200).json(answer);
  }

  if (req.method === 'POST') {
    const answer = await createPMFAnswer({ ...req.body, userId: id });
    res.status(200).json(answer);
  }
};