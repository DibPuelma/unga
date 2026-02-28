import { softDeleteSubObjective, updateSubObjective } from "db/subObjectives";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { subObjectiveId, classroomId }, body } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }

  if (req.method === 'DELETE') {
    const response = await softDeleteSubObjective(subObjectiveId, classroomId);
    res.status(200).json(response);
  }

  if (req.method === 'PATCH') {
    try {
      const response = await updateSubObjective(subObjectiveId, body);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  }
};