import { updateStudent, getStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { query: { id } } = req;
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  if (req.method === 'PATCH') {
    let query = null;
    try {
      const student = await getStudent(id);
      if (!classrooms.includes(student.classId)) {
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