import { updateClassroomReportConfiguration } from "db/classroomReportConfiguration";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, reportConfigurationId } } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }
  if (req.method === 'PATCH') {
    const query = await updateClassroomReportConfiguration(reportConfigurationId, req.body);
    res.status(200).json(query);
  }
};