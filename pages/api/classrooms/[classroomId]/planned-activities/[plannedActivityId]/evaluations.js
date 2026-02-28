import { createPlannedActivityEvaluation } from 'db/plannedActivityEvaluation';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user, user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, plannedActivityId } } = req
  if (!classrooms?.includes(classroomId)) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.method == 'POST') {
    const query = await createPlannedActivityEvaluation({
      ...req.body,
      plannedActivityId,
      classroomId,
      teacherId: user.id,
    })
    res.status(200).json({ ...query });
  }
};