import { getClassesByInstitution } from "db/class";
import { getStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import PlansService from "./PlansService";

const validatePrincipalAccess = (paramsInstitutionId, session) => {
  const { user: { institution, institutionId, role } } = session;
  const userInstitutionId = institution?.id || institutionId;

  if (role === 'principal' && userInstitutionId === paramsInstitutionId) {
    return [true, null];
  }

  return [
    false,
    {
      redirect: {
        permanent: false,
        destination: '/',
      }
    }
  ]
}

const validateInstitutionAccess = (paramsInstitutionId, session) => {
  const { user: { institution, institutionId } } = session;
  const userInstitutionId = institution?.id || institutionId;

  if (userInstitutionId === paramsInstitutionId) {
    return [true, null];
  }

  return [
    false,
    {
      redirect: {
        permanent: false,
        destination: '/',
      }
    }
  ]
}

const validateUserAccess = (paramsUserId, session) => {
  const { user } = session;
  if (user.id !== paramsUserId) {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/'
        }
      }
    ]
  }
  return [true, null];
}

const validateClassroomAccess = async (classroomId, session) => {
  const { user: { institution, institutionId, class: _class, role, classrooms } } = session;
  if (role === 'principal') {
    const userInstitutionId = institution?.id || institutionId;
    const classes = await getClassesByInstitution(userInstitutionId);
    const ids = classes.map((cls) => cls.id);
    if (!ids.includes(classroomId)) {
      return [
        false,
        {
          redirect: {
            permanent: false,
            destination: `/institutions/${userInstitutionId}`
          }
        }
      ]
    }
  }

  if (role !== 'principal' && !classrooms?.includes(classroomId)) {
    // If no classrooms available, redirect to home (which will handle onboarding)
    if (!classrooms || classrooms.length === 0) {
      return [
        false,
        {
          redirect: {
            permanent: false,
            destination: '/',
          }
        }
      ]
    }
    // Prevent redirect loop: if redirecting to the same classroom, go to home instead
    const redirectClassroomId = classrooms[0];
    if (redirectClassroomId === classroomId) {
      return [
        false,
        {
          redirect: {
            permanent: false,
            destination: '/',
          }
        }
      ]
    }
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: `/classes/${redirectClassroomId}`,
        }
      }
    ]
  }

  return [true, null];
}

const validateCreateObservationAccess = (classroomId, session) => {
  const { user: { classrooms } } = session;
  if (!classrooms?.includes(classroomId)) {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: `/classes/${classrooms[0]}`
        }
      }
    ];
  }
  return [true, null];
}

const validateStudentAccess = async (studentId, session) => {
  const { user: { institution, institutionId } } = session;
  const userInstitutionId = institution?.id || institutionId;

  const student = await getStudent(studentId);
  const studentInstitutionId = student.institutionId;
  const notAllowed = userInstitutionId !== studentInstitutionId;

  if (notAllowed) {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/',
        }
      }
    ]
  }

  return [true, null];
}

const validateStudentAndClassroomAccess = async (classroomId, studentId, session) => {
  const [classroomAccess, returnClassroomAccess] = await validateClassroomAccess(classroomId, session);
  if (!classroomAccess) return [classroomAccess, returnClassroomAccess];

  const { user: { role, institution, institutionId } } = session;
  const userInstitutionId = institution?.id || institutionId;

  const student = await getStudent(studentId);
  const studentInstitutionId = student.institutionId;
  const studentClassroomId = student.classId;
  
  const principalNotAllowed = role === 'principal' && userInstitutionId !== studentInstitutionId;
  const teacherOrCoordinatorNotAllowed = role !== 'principal' && classroomId !== studentClassroomId;

  if (principalNotAllowed || teacherOrCoordinatorNotAllowed) {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/',
        }
      }
    ]
  }

  return [true, null];
}

const validateSuperAdmin = (session) => {
  const { user: { role } } = session;
  if (role !== 'superAdmin') {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/',
        }
      }
    ]
  }

  return [true, null];
}

// Onboarding is only for users still missing their institution or classrooms.
const validateOnboarding = (session) => {
  const { user: { role, institution, institutionId, classrooms } } = session;
  const hasInstitution = institution?.id || institutionId;

  if (!hasInstitution) return [true, null];
  if (role === 'teacher' && (!classrooms || classrooms.length === 0)) return [true, null];

  return [
    false,
    {
      redirect: {
        permanent: false,
        destination: '/',
      }
    }
  ]
}

const validateParent = (session) => {
  const { user: { role } } = session;
  if (role !== 'parent') {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/',
        }
      }
    ]
  }

  return [true, null];
}


export const isAuthorized = async (context, authorizedPlans = PlansService.ALL_PLANS) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { params, resolvedUrl, query } = context;
  const urlWithoutParams = resolvedUrl.split('?')[0];
  const lastUrlText = resolvedUrl.split('/').pop().split('?')[0];

  if (!session) {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/auth/login'
        }
      }
    ];
  }

  // Allow access if plan is null/undefined (user hasn't selected a plan yet)
  // Otherwise, check if plan is in authorized plans
  if (session.user.plan != null && !authorizedPlans.includes(session.user.plan)) {
    return [
      false,
      {
        redirect: {
          permanent: false,
          destination: '/'
        }
      }
    ];
  }

  if (urlWithoutParams.includes('onboarding')) {
    return validateOnboarding(session);
  }

  if (urlWithoutParams.includes('super-admin')) {
    return validateSuperAdmin(session);
  }

  if (urlWithoutParams.includes('parents')) {
    return validateParent(session);
  }

  if (!params) return [true, null];

  // Lesson plan
  if (lastUrlText === 'lesson-plan') {
    return validateClassroomAccess(params.classroomId, session);
  }
  // Create observation
  if (lastUrlText === 'observation') {
    return validateCreateObservationAccess(params.classroomId, session);
  }

  // Report
  if (lastUrlText === 'report') {
    return validateClassroomAccess(params.classroomId, session);
  }

  // Create activity
  if (urlWithoutParams.includes('activities')) {
    if (query.hasOwnProperty('classroom')) return validateClassroomAccess(query.classroom, session);
    return validateInstitutionAccess(params.institutionId, session);
  }

  if (params.hasOwnProperty('studentId') && params.hasOwnProperty('classroomId')) {
    return await validateStudentAndClassroomAccess(params.classroomId, params.studentId, session);
  } else if (params.hasOwnProperty('classroomId')) {
    return await validateClassroomAccess(params.classroomId, session);
  } else if (params.hasOwnProperty('studentId')) {
    return await validateStudentAccess(params.studentId, session);
  } else if (params.hasOwnProperty('userId')) {
    return validateUserAccess(params.userId, session);
  } else if (params.hasOwnProperty('institutionId')) {
    if (urlWithoutParams.includes('configuration')) return validateInstitutionAccess(params.institutionId, session);
    return validatePrincipalAccess(params.institutionId, session);
  }

  // Default: allow access if no specific validation is needed
  return [true, null];
}