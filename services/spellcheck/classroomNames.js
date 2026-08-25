import { getAllStudentsForClassroom } from 'db/student';
import { getClassroom } from 'db/class';

// Full roster of the classroom (students past and present, plus every
// teacher), so names are whitelisted even when the child isn't tagged in
// the observation being checked.
export const classroomNameWords = async (classroomId) => {
  const [students, classroom] = await Promise.all([
    getAllStudentsForClassroom(classroomId),
    getClassroom(classroomId),
  ]);
  const teachers = [classroom?.mainTeacher, ...(classroom?.allTeachers || [])];
  return [
    ...students.flatMap((student) => [student.firstName, student.lastName]),
    ...teachers.flatMap((teacher) => [teacher?.firstName, teacher?.lastName]),
  ].filter(Boolean);
};
