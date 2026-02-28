import { createStudent, getAllStudentsForInstitution, updateStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { institutionAuthorization } from "pages/api/auth/authorizations";
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { query: { institutionId }, body } = req;
  const { user, user: { institution } } = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    if (!(await institutionAuthorization(user, institutionId))) return res.status(403).end();

    const query = await getAllStudentsForInstitution(institutionId);
    return res.status(200).json(serializeForAPI(query));
  }
  
  if (req.method === 'PATCH') {
    if (institution.id !== institutionId) return res.status(403).end();

    try {
      const response = []
      for (let i = 0; i < body.length; i++) {
        const studentData = body[i];
        response.push(await updateStudent(studentData.id, { classroom: studentData.classroom }));
      }
      return res.status(200).json(serializeForAPI(response));
    } catch (e) {
      console.error(e);
      return res.status(400).end();
    }
  }

  if (req.method === 'POST') {
    if (institution.id !== institutionId) return res.status(403).end();

    try {
      const response = []
      for (let i = 0; i < body.length; i++) {
        const studentData = body[i];
        response.push(await createStudent({ ...studentData, institution: institutionId }));
      }
      return res.status(200).json(serializeForAPI(response));
    } catch (e) {
      console.error(e);
      return res.status(400).end();
    }
  }
};