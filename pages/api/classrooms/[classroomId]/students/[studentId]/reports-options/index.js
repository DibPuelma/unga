import { getReportOptionsForStudentAndClassroom } from "db/reportsOptions";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { classrooms, institution } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, studentId } } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }
  if (req.method == 'GET') {
    const query = await getReportOptionsForStudentAndClassroom(studentId, classroomId, institution.id);
    res.status(200).json(serializeForAPI(query));
  }
};