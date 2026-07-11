
import { updateReport } from "db/report";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  const { query: { classroomId } } = req;
  if (!await classroomAuthorization(user, classroomId)) return res.status(401).end();

  if (req.method == 'PATCH') {
    const query = await updateReport({ id: req.query.reportId, ...req.body, teacher: user.id })
    res.status(200).json({ ...query });
  }
};