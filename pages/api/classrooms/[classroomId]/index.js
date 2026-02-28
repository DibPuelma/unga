import {
  updateClassroom,
  getClassroom,
} from "db/class";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { classroomId }, body } = req;
  if (req.method === 'PATCH') {
    const session = await getServerSession(req, res, authOptions);
    const { user } = session;
    const { role, classrooms, institution: { id: userInstitutionId } } = user;

    // Check authorization
    if (role === 'teacher' || role === 'coordinator') {
      if (!classrooms.includes(classroomId)) {
        return res.status(403).end();
      }
      // Teachers and coordinators can only update mainTeacher
      try {
        const query = await updateClassroom(classroomId, {
          mainTeacher: body.mainTeacher,
        });
        res.status(200).json(query);
      } catch (e) {
        console.error(e);
        res.status(400).json(e);
      }
      return;
    }

    // Principals and super admins can update dailyActivitiesPerDay
    if (role === 'principal' || role === 'superAdmin') {
      if (role === 'principal') {
        const classroom = await getClassroom(classroomId);
        if (classroom.institutionId !== userInstitutionId) {
          return res.status(403).end();
        }
      }

      try {
        const updateData = {};
        if (body.mainTeacher !== undefined) {
          updateData.mainTeacher = body.mainTeacher;
        }
        if (body.dailyActivitiesPerDay !== undefined) {
          updateData.dailyActivitiesPerDay = body.dailyActivitiesPerDay;
        }
        const query = await updateClassroom(classroomId, updateData);
        res.status(200).json(query);
      } catch (e) {
        console.error(e);
        res.status(400).json(e);
      }
      return;
    }

    return res.status(403).end();
  }
};