import { createUser, getAllInstitutionUsers } from "db/user";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { institutionAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user } = await getServerSession(req, res, authOptions);

  if (req.method == 'GET') {
    if (!(await institutionAuthorization(user, institutionId))) return res.status(403);

    const query = await getAllInstitutionUsers(institutionId);
    res.status(200).json(query);
  }

  if (req.method === 'POST') {
    const { institution } = user;
    if (institution.id !== institutionId) return res.status(403).end();

    const query = await createUser({ ...req.body, institution: institutionId });
    res.status(200).json(query);
  }
};