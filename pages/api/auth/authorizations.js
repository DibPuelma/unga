import { getClassroom } from "db/class";
import { getInstitution } from "db/institution";

export const classroomAuthorization = async (user, classroomId) => {
  const { classrooms, role, institution, institutionId: userInstitutionId } = user;
  const userInstitutionIdValue = institution?.id || userInstitutionId;
  
  if (role === 'teacher') {
    const teacherAuthorized = classrooms && classrooms.includes(classroomId)
    return teacherAuthorized;
  }
  if (role === 'principal' || role === 'coordinator') {
    const fullClass = await getClassroom(classroomId);
    const classInstitutionId = fullClass.institutionId;
    const authorized = classInstitutionId === userInstitutionIdValue;
    return authorized;
  }
  return false;
}

export const institutionAuthorization = async (user, institutionId) => {
  if (!user) return false;
  
  const { role, institution, institutionId: userInstitutionId } = user;
  const userInstitutionIdValue = institution?.id || userInstitutionId;

  // Allow principals, coordinators, and teachers to access their institution
  if (role === 'principal' || role === 'coordinator' || role === 'teacher') {
    return userInstitutionIdValue === institutionId;
  }

  // Allow superAdmin to access any institution
  if (role === 'superAdmin') {
    return true;
  }

  return false;
}