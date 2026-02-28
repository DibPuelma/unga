import { createSubObjectiveEvaluation } from '../../db/subObjectiveEvaluation';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user, user: { classrooms } } = await getServerSession(req, res, authOptions);
  if (req.method == 'POST') {
    if (!classrooms?.includes(req.body.classroomId)) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const query = await createSubObjectiveEvaluation({ ...req.body, teacherId: user.id })
    res.status(200).json({ ...query });
  }
};