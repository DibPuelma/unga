import { createUser } from 'db/user';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { body } = req;
  if (req.method === 'POST') {
    const session = getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();

    const requiredParams = ['email', 'firstName', 'lastName', 'country', 'plan', 'password', 'reference'];
    requiredParams.forEach((param) => {
      if (!body[param]) return res.status(400).json({ message: `Parameter ${param} is required` });
    })
    try {
      const query = await createUser(body);
      return res.status(200).json(serializeForAPI(query));
    } catch (e) {
      console.error(e)
      return res.status(400).json(e);
    }
  }
}