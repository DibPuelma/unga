import { getOrCreateClassroomReportConfiguration } from "db/classroomReportConfiguration";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  const { query: { classroomId } } = req;
  if (!await classroomAuthorization(user, classroomId)) {
    return res.status(403).end();
  }
  if (req.method === 'GET') {
    const query = await getOrCreateClassroomReportConfiguration(classroomId);
    res.status(200).json(query);
  }
};