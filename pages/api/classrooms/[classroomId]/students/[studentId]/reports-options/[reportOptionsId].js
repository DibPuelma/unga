import { updateReportOptions } from "db/reportsOptions";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { classrooms, institution } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, studentId, reportOptionsId }, body } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }
  if (req.method == 'PATCH') {
    const query = await updateReportOptions(reportOptionsId, studentId, institution.id, classroomId, body);
    res.status(200).json(serializeForAPI(query));
  }
};