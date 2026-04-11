import { getObjectivesTree } from "db/core";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user } = await getServerSession(req, res, authOptions);
  const { institution, institutionId: userInstitutionId } = user;
  const userInstitutionIdValue = institution?.id || userInstitutionId;

  if (userInstitutionIdValue !== institutionId) return res.status(403).end();

  if (req.method === 'GET') {
    const tree = await getObjectivesTree(institutionId);
    return res.status(200).json(tree);
  }

  return res.status(405).end();
};
