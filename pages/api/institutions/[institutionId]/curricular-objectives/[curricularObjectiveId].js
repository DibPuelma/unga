import { deleteCurricularObjective } from "db/curricularObjectives";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { institutionId, curricularObjectiveId } } = req;
  const { user } = await getServerSession(req, res, authOptions);
  const { institution, institutionId: userInstitutionId } = user;
  const userInstitutionIdValue = institution?.id || userInstitutionId;

  if (userInstitutionIdValue !== institutionId) return res.status(403).end();
  if (user.role !== 'principal') return res.status(403).end();

  if (req.method === 'DELETE') {
    try {
      await deleteCurricularObjective(curricularObjectiveId);
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(400).json({ error: e.message });
    }
  }

  return res.status(405).end();
};
