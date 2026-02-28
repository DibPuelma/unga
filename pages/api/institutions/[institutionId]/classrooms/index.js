import { getAllClassesByInstitution } from "db/class";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { institutionAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user } = await getServerSession(req, res, authOptions);

  if (req.method == 'GET') {
    if (!(await institutionAuthorization(user, institutionId))) return res.status(403);

    const query = await getAllClassesByInstitution(institutionId);
    res.status(200).json(query);
  }
};