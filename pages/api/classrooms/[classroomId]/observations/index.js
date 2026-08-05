import { getFullObservationsByClass } from "db/observation";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, after, startDate, endDate } } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }

  if (req.method === 'GET') {
    const { data, after: nextCursor } = await getFullObservationsByClass({
      classroomId,
      after,
      startDate,
      endDate,
    });
    res.status(200).json({ data, after: nextCursor });
  }
};
