import { updateClassroomReportConfiguration } from "db/classroomReportConfiguration";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, reportConfigurationId } } = req;
  if (!await classroomAuthorization(user, classroomId)) {
    return res.status(403).end();
  }
  if (req.method === 'PATCH') {
    const query = await updateClassroomReportConfiguration(classroomId, req.body);
    res.status(200).json(query);
  }
};