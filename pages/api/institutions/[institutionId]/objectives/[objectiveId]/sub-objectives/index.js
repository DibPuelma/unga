import { createSubObjective, updateSubObjective } from "db/subObjectives";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user, user: { institution } } = await getServerSession(req, res, authOptions);
  const { query: { institutionId, objectiveId } } = req;
  if ((institution.id !== institutionId)) {
    return res.status(403);
  }

  if (req.method == 'POST') {
    try {
      const response = await createSubObjective({
        ...req.body,
        user,
        objective: objectiveId,
        institution: institution.id,
      });
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  }
};