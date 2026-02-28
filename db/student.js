import prisma from './prisma';

export const createStudent = async (data) => {
  const {
    firstName,
    lastName,
    rut,
    birthDate,
    classroom,
    institution,
  } = data;

  const student = await prisma.students.create({
    data: {
      firstName,
      lastName,
      rut: rut || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      classId: classroom,
      institutionId: institution,
    },
    include: {
      Classes: true,
    },
  });

  return JSON.parse(JSON.stringify({
    ...student,
    classroom: student.Classes,
  }));
}

export const updateStudent = async (id, data) => {
  const updateData = {};

  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.rut !== undefined) updateData.rut = data.rut || null;
  if (data.birthDate) updateData.birthDate = new Date(data.birthDate);
  if (data.classroom) updateData.classId = data.classroom;
  if (data.profilePicture) updateData.profilePicture = data.profilePicture;

  const student = await prisma.students.update({
    where: { id },
    data: updateData,
    include: {
      Classes: true,
    },
  });

  return JSON.parse(JSON.stringify({
    ...student,
    classroom: student.Classes,
  }));
}

export const softDeleteStudent = async (id) => {
  const student = await prisma.students.update({
    where: { id },
        data: {
      deletedAt: new Date(),
    },
  });

  return student;
}

export const deactivateStudent = async (studentId) => {
  const student = await prisma.students.update({
    where: { id: studentId },
    data: { deactivatedAt: new Date() },
  });

  return student;
}

export const activateStudent = async (studentId) => {
  const student = await prisma.students.update({
    where: { id: studentId },
    data: { deactivatedAt: null },
  });

  return student;
}

export const deactivateStudentsForClassroom = async (classroomId) => {
  await prisma.students.updateMany({
    where: { classId: classroomId },
    data: { deactivatedAt: new Date() },
  });
}

export const activateStudentsForClassroom = async (classroomId) => {
  await prisma.students.updateMany({
    where: { classId: classroomId },
    data: { deactivatedAt: null },
  });
}

export const getStudent = async (studentId) => {
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    include: {
      Classes: true,
    },
  });

  if (!student) return null;

  return JSON.parse(JSON.stringify({
    ...student,
    fullName: `${student.firstName} ${student.lastName}`,
    class: student.Classes,
  }));
};

export const getAllStudentsForClassroom = async (classroomId) => {
  const students = await prisma.students.findMany({
    where: {
      classId: classroomId,
      deletedAt: null,
    },
  });

  return students.map((s) => ({
    ...s,
    fullName: `${s.firstName} ${s.lastName}`,
  }));
};

export const getStudentsForClassroom = async (classroomId) => {
  const students = await prisma.students.findMany({
    where: {
      classId: classroomId,
      deactivatedAt: null,
      deletedAt: null,
    },
  });

  return students.map((s) => ({
    ...s,
    fullName: `${s.firstName} ${s.lastName}`,
  }));
};

export const getAllStudentsForInstitution = async (institutionId) => {
  const students = await prisma.students.findMany({
    where: {
      institutionId,
      deletedAt: null,
    },
    include: {
      Classes: true,
    },
    take: 1000,
  });

  return students.map((s) => ({
    ...s,
    classroom: s.Classes,
  }));
};

export const countAllStudentsForInstitution = async (institutionId) => {
  const count = await prisma.students.count({
    where: {
      institutionId,
    },
  });

  return count;
};
