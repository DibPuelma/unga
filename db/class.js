import prisma from './prisma';
import { addClassroomToObjectivesByLevelAndInstitution, removeClassroomFromObjectives } from './objective';
import { removeClassroomFromSubObjectives, addClassroomToSubObjectivesByLevelAndInstitution } from './subObjectives';
import { withParsedAssets } from './user';

export const createClassroom = async ({ name, level, institution, mainTeacher }) => {
  const classroom = await prisma.classes.create({
        data: {
          name,
      levelId: level,
      institutionId: institution,
      mainTeacherId: mainTeacher || null,
        },
  });

  // Automatically associate objectives based on level and institution
  try {
    await addClassroomToObjectivesByLevelAndInstitution(classroom.id, level, institution);
  } catch (error) {
    console.error(`Error asociando objetivos a la sala ${classroom.name}:`, error);
    // Don't fail the whole operation, just log the error
  }

  // Automatically associate sub-objectives based on level and institution
  try {
    await addClassroomToSubObjectivesByLevelAndInstitution(classroom.id, level, institution);
  } catch (error) {
    console.error(`Error asociando sub-objetivos a la sala ${classroom.name}:`, error);
    // Don't fail the whole operation, just log the error
  }

  return classroom;
}

export const getClassroom = async (classroomId) => {
  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    include: {
      users: true,
      Levels: true,
      Institutions: true,
      _count: {
        select: {
          Students: {
            where: {
              deactivatedAt: null,
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  if (!classroom) return null;

  // Get all teachers for this classroom
  const teachers = await prisma.user.findMany({
    where: {
      classrooms: { has: classroomId },
      role: 'teacher',
    },
  });

  // Transform to lowercase for backward compatibility
  return JSON.parse(JSON.stringify({
    ...classroom,
    mainTeacher: withParsedAssets(classroom.users),
    allTeachers: teachers.map(withParsedAssets),
    level: classroom.Levels,
    institution: classroom.Institutions,
    studentCount: classroom._count.Students,
  }));
}

export const getClassesByInstitution = async (institutionId) => {
  const classes = await prisma.classes.findMany({
    where: {
      institutionId,
      deletedAt: null,
    },
    include: {
      Levels: true,
    },
  });

  return classes;
}

export const getAllClassesByInstitution = async (institutionId) => {
  const classes = await prisma.classes.findMany({
    where: {
      institutionId,
    },
    include: {
      Levels: true,
    },
  });

  return classes;
}

export const updateClassroom = async (classroomId, data) => {
  const updateData = {};
  
  if (data.mainTeacher !== undefined) {
    updateData.mainTeacherId = data.mainTeacher || null;
  }

  if (data.dailyActivitiesPerDay !== undefined) {
    updateData.dailyActivitiesPerDay = data.dailyActivitiesPerDay || null;
  }

  const classroom = await prisma.classes.update({
    where: { id: classroomId },
    data: updateData,
  });

  return classroom;
}

export const deleteClassroom = async (classroomId) => {
  // Remove classroom from objectives (doesn't delete objectives)
  try {
    await removeClassroomFromObjectives(classroomId);
  } catch (error) {
    console.error(`Error removiendo sala de objetivos:`, error);
    // Continue even if this fails
  }

  // Remove classroom from sub-objectives (doesn't delete sub-objectives)
  try {
    await removeClassroomFromSubObjectives(classroomId);
  } catch (error) {
    console.error(`Error removiendo sala de sub-objetivos:`, error);
    // Continue even if this fails
  }

  // Soft delete the classroom (students and teachers remain untouched)
  const classroom = await prisma.classes.update({
    where: { id: classroomId },
    data: {
      deletedAt: new Date(),
    },
  });

  return classroom;
}
