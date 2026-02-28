import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from 'pages/api/auth/authorizations';
import SuggestCalendarService from 'services/SuggestCalendarService';

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    const { query: { classroomId, referenceDate, lockedActivitiesIdsByDay } } = req;
    const authorized = await classroomAuthorization(user, classroomId);
    if (!authorized) return res.status(403).end();
    const parsedLockedActivitiesIdsByDay = JSON.parse(lockedActivitiesIdsByDay);
    const service = await SuggestCalendarService.initializeService(classroomId, referenceDate, parsedLockedActivitiesIdsByDay);
    const suggestedActivitiesByDay = await service.getWeeklyActivitiesByDay();
    res.status(200).json(suggestedActivitiesByDay);
  }
};