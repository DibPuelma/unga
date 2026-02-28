import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getEvaluationsByStudentAndCore } from "db/evaluation";

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, studentId, coreId } } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }

  if (req.method == 'GET') {
    const query = await getEvaluationsByStudentAndCore(studentId, coreId);
    res.status(200).json(query);
  }
};