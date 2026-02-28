import { getAttendanceByStudentAndDatesForInstitution } from "db/attendance";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getAttendanceAnalyticsByDateAndMonth } from "services/attendance";

export default async (req, res) => {
  const { user: { classrooms, institution } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, studentId, startDate, endDate, analyticsByMonth } } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }

  if (req.method === 'GET') {
    const query = await getAttendanceByStudentAndDatesForInstitution(
      studentId,
      institution.id,
      startDate,
      endDate,
    );

    if (analyticsByMonth) {
      const attendanceByDateAndMonth = getAttendanceAnalyticsByDateAndMonth(
        query,
        startDate,
        endDate,
      );
      res.status(200).json(attendanceByDateAndMonth);
    } else {
      res.status(200).json(query.data);
    }
  }
};