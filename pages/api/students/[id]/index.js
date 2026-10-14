import { updateStudent, getStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { classroomAuthorization } from 'pages/api/auth/authorizations';
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { query: { id } } = req;
  const { user } = await getServerSession(req, res, authOptions);
  if (req.method === 'PATCH') {
    let query = null;
    try {
      const student = await getStudent(id);
      if (!student) return res.status(404).json({ message: 'Not found' });
      if (!await classroomAuthorization(user, student.classId)) {
        return res.status(403).json({ message: 'Forbidden'});
      }
      query = await updateStudent(id, req.body);
      res.status(200).json(serializeForAPI(query));
    } catch (e) {
      console.error(e)
      res.status(400).json(e);
    }
  }
};