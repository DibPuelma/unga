import { countAllObjectivesForInstitution } from "db/objective";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user: { institution, institutionId: userInstitutionId } } = await getServerSession(req, res, authOptions);
  const userInstitutionIdValue = institution?.id || userInstitutionId;

  if (userInstitutionIdValue !== institutionId) return res.status(403).end();

  if (req.method === 'GET') {
    try {
      const query = await countAllObjectivesForInstitution(institutionId);
      return res.status(200).json(query);
    } catch (e) {
      console.error(e);
      return res.status(400).end();
    }
  }
};