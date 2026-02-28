import { getCores } from "db/core";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user: { institution } } = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    if (institution.id !== institutionId) return res.status(403).end();

    const query = await getCores(institutionId);
    return res.status(200).json(query);
  }
};