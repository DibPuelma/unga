import { createClassroomAttendances, getAttendanceByClassroomAndDates, updateClassroomAttendances } from "db/attendance";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getAttendanceAnalyticsByDateAndMonth } from "services/attendance";

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, startDate, endDate, analyticsByMonth }, body } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }

  if (req.method === 'GET') {
    const rows = await getAttendanceByClassroomAndDates(
      classroomId,
      startDate,
      endDate,
    );
    const attendances = Array.isArray(rows) ? rows : rows?.data ?? [];

    if (analyticsByMonth) {
      const attendanceByDateAndMonth = getAttendanceAnalyticsByDateAndMonth(
        attendances,
        startDate,
        endDate,
        );
      res.status(200).json(attendanceByDateAndMonth);
    } else {
      res.status(200).json(attendances);
    }
  }

  if (req.method === 'POST') {
    const query = await createClassroomAttendances({ ...body, classroom: classroomId });
    res.status(200).json(query);
  }

  if (req.method === 'PATCH') {
    const query = await updateClassroomAttendances({ ...body, classroom: classroomId });
    res.status(200).json(query);
  }
};