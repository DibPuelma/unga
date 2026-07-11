import { getReportOptionsForStudentAndClassroom } from "db/reportsOptions";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';
import { classroomAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, studentId } } = req;
  if (!await classroomAuthorization(user, classroomId)) {
    return res.status(403).end();
  }
  if (req.method == 'GET') {
    const query = await getReportOptionsForStudentAndClassroom(studentId, classroomId, user.institution.id);
    res.status(200).json(serializeForAPI(query));
  }
};