import { getPlannedActivitiesByClassroomAndDates, planActivity } from '../../../../../db/plannedActivity';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    const { query: { classroomId, startDate, endDate } } = req;
    const authorized = await classroomAuthorization(user, classroomId);
    if (!authorized) return res.status(403).end();

    const query = await getPlannedActivitiesByClassroomAndDates(classroomId, startDate, endDate);
    res.status(200).json(query);
  }
};