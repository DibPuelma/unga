import { createInstitution } from "db/institution";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { body } = req;
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();

    const country = session.user.country;

    const requiredParams = ['name'];
    requiredParams.forEach((param) => {
      if (!body[param]) return res.status(400).json({ message: `Parameter ${param} is required` });
    })
    try {
      const query = await createInstitution({ ...body, country })
      res.status(200).json(query);
    } catch (e) {
      console.error(e)
      res.status(400).json(e);
    }
  }
};