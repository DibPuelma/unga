import { getObservation, updateObservation, softDeleteObservation } from '../../../db/observation';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { id, institution } } = await getServerSession(req, res, authOptions);
  const { query: { observationId } } = req;
  const observation = await getObservation(observationId);
  if (observation.teacherId !== id) return res.status(403).json({ message: "Forbidden" });

  if (req.method === 'PATCH') {
    const query = await updateObservation(observationId, {
      ...req.body,
      updatedBy: id,
      institution: institution.id,
    });
    res.status(200).json(serializeForAPI({ ...query }));
  }

  if (req.method === 'DELETE') {
    const query = await softDeleteObservation(observationId);
    res.status(200).json(serializeForAPI({ ...query }));
  }
};