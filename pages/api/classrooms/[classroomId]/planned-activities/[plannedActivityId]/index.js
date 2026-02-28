import { deletePlannedActivity, updatePlannedActivity } from "db/plannedActivity";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);

  const { query: { classroomId, plannedActivityId }, body } = req;
  if (req.method === 'PATCH') {
    const authorized = await classroomAuthorization(user, classroomId);
    if (!authorized) return res.status(403);

    const query = await updatePlannedActivity(plannedActivityId, body);
    res.status(200).json(query);
  }

  if (req.method === 'DELETE') {
    const authorized = await classroomAuthorization(user, classroomId);
    if (!authorized) return res.status(403);

    const query = await deletePlannedActivity(plannedActivityId, user.id);
    res.status(200).json(query);
  }
};