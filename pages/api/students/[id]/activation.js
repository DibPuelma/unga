import { activateStudent, deactivateStudent, getStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  if (req.method == 'PATCH') {
    const { query: { id: studentId } } = req;

    const student = await getStudent(studentId);
    if (!classrooms.includes(student.classId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { query: { action } } = req;
    const query = action === 'ACTIVATE' ? await activateStudent(studentId) : await deactivateStudent(studentId);
    res.status(200).json(query);
  }
};