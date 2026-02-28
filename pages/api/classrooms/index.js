import { createClassroom } from "db/class";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { body } = req;
  if (req.method == 'POST') {
    const session = getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();

    const requiredParams = ['name', 'level', 'institution'];
    requiredParams.forEach((param) => {
      if (!body[param]) return res.status(400).json({ message: `Parameter ${param} is required` });
    })
    try {
      const query = await createClassroom(body)
      return res.status(200).json(query);
    } catch (e) {
      console.error(e)
      return res.status(400).json(e);
    }
  }
};