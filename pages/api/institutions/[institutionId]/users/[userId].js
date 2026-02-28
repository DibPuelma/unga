import { removeUserFromInstitution } from "db/user";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { query: { institutionId, userId } } = req;
  const { user } = await getServerSession(req, res, authOptions);

  if (req.method === 'DELETE') {
    const { institution } = user;
    if (institution.id !== institutionId) return res.status(403).end();

    const query = await removeUserFromInstitution(userId);
    res.status(200).json(serializeForAPI(query));
  }
};