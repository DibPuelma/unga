import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getCurricularObjectivesByCountry, getCurricularObjectivesByCountryAndMethodology, getCurricularObjectivesByInstitution } from 'db/curricularObjectives';

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401);

  if (req.method == 'GET') {
    const { methodology, institutionId: queryInstitutionId } = req.query;
    const institutionId = queryInstitutionId || session.user?.institution?.id || session.user?.institutionId;
    
    if (!institutionId) {
      return res.status(400).json({ error: 'Institution ID is required' });
    }

    let curricularObjectives = null;
    if (methodology && methodology !== 'undefined') {
      curricularObjectives = await getCurricularObjectivesByCountryAndMethodology('Chile', methodology, institutionId);
    } else {
      curricularObjectives = await getCurricularObjectivesByCountry('Chile', institutionId);
    }
    res.status(200).json(curricularObjectives);
  }
};