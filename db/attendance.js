import prisma from './prisma';

export const ATTENDANCE_TYPES = ['present', 'absent', 'late', 'retiredEarly', 'notRegistered'];
export const ATTENDANCE_TYPES_TO_SPANISH = {
  absent: 'Ausente',
  late: 'Llega tarde',
  retiredEarly: 'Retiro anticipado',
  present: 'Presente',
  notRegistered: 'Sin registro',
}
export const ATTENDANCE_TYPES_TO_COLOR = {
  absent: 'error',
  late: 'warning',
  retiredEarly: 'info',
  present: 'success',
}

export const getAttendanceByStudentAndDatesForInstitution = async (studentId, institutionId, startDate, endDate) => {
  const attendances = await prisma.attendances.findMany({
    where: {
      studentId,
      attendanceDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      Classes: {
        institutionId,
      },
    },
    include: {
      Classes: {
        include: {
          Institutions: true,
        },
      },
    },
    take: 10000,
  });

  return attendances;
};

export const getAttendanceByClassroomAndDates = async (classroomId, startDate, endDate) => {
  const attendances = await prisma.attendances.findMany({
    where: {
      classroomId,
      attendanceDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    take: 10000,
  });

  return attendances;
};

export const updateClassroomAttendances = async ({
  attendancesPerStudent,
  classroom,
}) => {
  const updates = Object.entries(attendancesPerStudent).map(([_, attendance]) => ({
    id: attendance.id,
    attendanceType: attendance.attendanceType,
  }));

  const results = await Promise.all(
    updates.map(({ id, attendanceType }) =>
      prisma.attendances.update({
        where: { id },
        data: {
          attendanceType,
          classroomId: classroom,
        },
      })
    )
  );

  return results;
}

export const createClassroomAttendances = async ({
  attendanceDate,
  attendancesPerStudent,
  classroom,
}) => {
  const attendances = Object.entries(attendancesPerStudent).map(([studentId, attendance]) => ({
    attendanceDate: new Date(attendanceDate),
    attendanceType: attendance.attendanceType,
    studentId,
    classroomId: classroom,
  }));

  const results = await prisma.attendances.createMany({
    data: attendances,
  });

  const created = await prisma.attendances.findMany({
    where: {
      attendanceDate: new Date(attendanceDate),
      classroomId: classroom,
    },
  });

  return created;
}
