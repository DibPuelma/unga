import { activateStudent, deactivateStudent, getStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { classroomAuthorization } from 'pages/api/auth/authorizations';
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  if (req.method == 'PATCH') {
    const { query: { id: studentId } } = req;

    const student = await getStudent(studentId);
    if (!student) return res.status(404).json({ message: 'Not found' });
    if (!await classroomAuthorization(user, student.classId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { query: { action } } = req;
    const query = action === 'ACTIVATE' ? await activateStudent(studentId) : await deactivateStudent(studentId);
    res.status(200).json(query);
  }
};
