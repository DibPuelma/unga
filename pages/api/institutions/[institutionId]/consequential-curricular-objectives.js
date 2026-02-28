import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { createConsequentialCurricularObjective } from 'db/consequentialCurricularObjectives';

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user: { institution } } = await getServerSession(req, res, authOptions);

  if (req.method === 'POST') {
    if (institution.id !== institutionId) return res.status(403).end();

    const query = await createConsequentialCurricularObjective({ institutionId, ...req.body });
    return res.status(200).json(query);
  }
};