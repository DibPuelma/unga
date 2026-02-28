import { createStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  if (req.method == 'POST') {
    const { user: { institution } } = await getServerSession(req, res, authOptions);
    try {
      const query = await createStudent({ ...req.body, institution: institution.id })
      res.status(200).json({ ...query });
    } catch (e) {
      res.status(400).json(e);
    }
  }
};