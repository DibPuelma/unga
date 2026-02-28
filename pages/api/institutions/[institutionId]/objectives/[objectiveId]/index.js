import { softDeleteObjective, updateObjective, getObjective } from "db/objective";
import { intersection } from "lodash";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user: { institution, classrooms, role } } = await getServerSession(req, res, authOptions);
  const { query: { institutionId, objectiveId } } = req;
  const objective = await getObjective(objectiveId);
  const objectiveClassrooms = objective.classrooms.map((classroom) => classroom.id);
  if (institution.id !== institutionId) {
    return res.status(403).end();
  }

  if (req.method == 'PATCH') {
    try {
      const response = await updateObjective(objectiveId, req.body);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  if (req.method === 'DELETE') {
    if (
      ((role === 'principal' || role === 'coordinator') && institution.id !== institutionId)
      || (role === 'teacher' && intersection(classrooms, objectiveClassrooms).length !== objectiveClassrooms.length)
    ) {
      return res.status(403).end();
    }
    try {
      const response = await softDeleteObjective(objectiveId);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json(error);
    }
  }
};