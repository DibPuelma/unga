
import { updateReport } from "db/report";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user, user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId } } = req;
  if (!classrooms.includes(classroomId)) return res.status(401).end();

  if (req.method == 'PATCH') {
    const query = await updateReport({ id: req.query.reportId, ...req.body, teacher: user.id })
    res.status(200).json({ ...query });
  }
};