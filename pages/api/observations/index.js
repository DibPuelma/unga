import { createObservation } from '../../../db/observation';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { id, institution, classrooms } } = await getServerSession(req, res, authOptions);
  const { body: { classroom } } = req;
  if (!classrooms?.includes(classroom)) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (req.method === 'POST') {
    const query = await createObservation({
      ...req.body,
      teacher: id,
      institution: institution.id,
    });
    res.status(200).json(serializeForAPI(query));
  }
};