import { createObjectiveForClassrooms, createObjectiveForClassroomsMassively, getObjectivesByInstitution } from "db/objective";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { institutionId } } = req;
  const { user } = await getServerSession(req, res, authOptions);
  const { institution, institutionId: userInstitutionId, classrooms } = user;
  const userInstitutionIdValue = institution?.id || userInstitutionId;
  
  if (userInstitutionIdValue !== institutionId) return res.status(403).end();

  if (req.method === 'POST') {
    const { query: { massive }, body: { classroomsIds, coreId, name, objectives } } = req;
    for (let i = 0; i < classroomsIds.length; i++) {
      const classroomId = classroomsIds[i];
      if (!classrooms.includes(classroomId)) return res.status(403).end();
    }

    try {
      if (massive) {
        const query = await createObjectiveForClassroomsMassively({ objectives, user });
        res.status(200).json(query);
      } else {
        const query = await createObjectiveForClassrooms({ user, classrooms: classroomsIds, core: coreId, name });
        res.status(200).json(query);
      }
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    const allObjectives = await getObjectivesByInstitution(institutionId);

    res.status(200).json(allObjectives);
  }
};