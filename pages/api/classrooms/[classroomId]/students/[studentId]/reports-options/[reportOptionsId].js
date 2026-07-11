import { updateReportOptions } from "db/reportsOptions";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';
import { classroomAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, studentId, reportOptionsId }, body } = req;
  if (!await classroomAuthorization(user, classroomId)) {
    return res.status(403).end();
  }
  if (req.method == 'PATCH') {
    const query = await updateReportOptions(reportOptionsId, studentId, user.institution.id, classroomId, body);
    res.status(200).json(serializeForAPI(query));
  }
};