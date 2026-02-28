import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getLevelsOfAchievement, updateLevelOfAchievement } from '../../db/levelsOfAchievement';
import { ascendingSort } from '../../src/helpers/arrays';

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(200).json(null)
  }
  if (req.method === 'GET') {
    const { user: { institution, institutionId: userInstitutionId } } = session;
    const institutionId = institution?.id || userInstitutionId;
    if (!institutionId) return res.status(200).json([]);
    const levelsOfAchievement = await getLevelsOfAchievement(institutionId);
    return res.status(200).json(ascendingSort(levelsOfAchievement, 'value'));
  }
  if (req.method === 'PUT') {
    const { user: { institution, institutionId: userInstitutionId } } = session;
    const institutionId = institution?.id || userInstitutionId;
    const { levelsOfAchievement } = req.body;

    const promises = [];

    for (let i = 0; i < levelsOfAchievement.length; i++) {
      const loa = levelsOfAchievement[i];
      const loaInstitutionId = loa.institutionId;
      if (loaInstitutionId !== institutionId) {
        return res.status(403)
      }
      const loaId = loa.id;
      promises.push(() => updateLevelOfAchievement(loaId, { description: loa.description }))
    }

    await Promise.all(promises.map((promise) => promise()))
    return res.status(200).json(levelsOfAchievement);
  }
};