import { updateSubObjective, softDeleteSubObjective } from "db/subObjectives";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user: { institution } } = await getServerSession(req, res, authOptions);
  const { query: { institutionId, subObjectiveId } } = req;
  if ((institution.id !== institutionId)) {
    return res.status(403);
  }

  if (req.method === 'PATCH') {
    try {
      const response = await updateSubObjective(subObjectiveId, req.body);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  if (req.method === 'DELETE') {
    try {
      const response = await softDeleteSubObjective(subObjectiveId);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  }
};