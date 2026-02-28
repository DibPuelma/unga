import { getPublicCores } from "db/core";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end();
  }

  if (req.method == 'GET') {
    try {
    let cores = await getPublicCores();
    res.status(200).json(cores);
    } catch (e) {
      console.error(e)
      res.status(400).json(e);
    }
  }
};