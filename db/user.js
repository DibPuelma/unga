import bcrypt from 'bcryptjs';
import prisma from './prisma';
import moment from 'moment-timezone';
import { grantSignupCredits } from './credits';
import SendAddRoleToUserSlackMessage from 'commands/slack/sendAddRoleToUserSlackMessage';
import SendNewUserSlackMessage from 'commands/slack/sendNewUserSlackMessage';

const normalizeInstitutionLogoForRead = (institution) => {
  if (!institution) return institution;
  const { logo } = institution;

  if (!logo || typeof logo === 'object') return institution;
  if (typeof logo !== 'string') return { ...institution, logo: null };

  try {
    return { ...institution, logo: JSON.parse(logo) };
  } catch (_) {
    return institution;
  }
};

// profilePicture/signature are TEXT columns but the UI sends a Cloudinary asset object.
// Store them as JSON strings and parse them back on read.
const normalizeAssetForWrite = (asset) => {
  if (asset === undefined) return undefined;
  if (asset === null) return null;
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'object') return JSON.stringify(asset);
  return null;
};

const normalizeAssetForRead = (asset) => {
  if (!asset) return asset;
  if (typeof asset === 'object') return asset;
  if (typeof asset !== 'string') return null;

  try {
    return JSON.parse(asset);
  } catch (_) {
    return asset;
  }
};

export const withParsedAssets = (user) => {
  if (!user) return user;
  return {
    ...user,
    profilePicture: normalizeAssetForRead(user.profilePicture),
    signature: normalizeAssetForRead(user.signature),
  };
};

export const createUser = async ({
  firstName,
  lastName,
  email,
  phoneNumber,
  country,
  password,
  role,
  plan,
  classrooms,
  institution,
  reference,
}) => {
  const userData = {
        email,
        firstName,
        lastName,
        phoneNumber,
        country,
        role,
        plan,
    classrooms: classrooms || [],
        reference,
    institutionId: institution || null,
  };

  if (password) {
    userData.password = await bcrypt.hash(password, 10);
  }

  const newUser = await prisma.user.create({
    data: userData,
    include: {
      Institutions: true,
    },
  });

  const result = {
    ...newUser,
    institution: normalizeInstitutionLogoForRead(newUser.Institutions),
    institutionName: newUser.Institutions?.name || null,
  };

  if (newUser.plan === 'free') {
    await grantSignupCredits(newUser.id);
  }

  new SendNewUserSlackMessage(result).perform();

  return JSON.parse(JSON.stringify(result));
}

export const removeUserFromInstitution = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
      data: {
      institutionId: null,
      classrooms: [],
    },
  });

  return user;
}

export const softDeleteUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
      data: {
      deletedAt: new Date(),
    },
  });

  return user;
}

export const checkEmailExists = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return !!user;
}

export const updateUser = async (userId, data) => {
  const updateData = { ...data };
  
  if (data.institution) {
    updateData.institutionId = data.institution;
    delete updateData.institution;
  }
  
  if (data.sawActivity) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { seenActivities: true },
    });
    const seenActivities = [...new Set([...(user?.seenActivities || []), data.sawActivity])];
    updateData.seenActivities = seenActivities;
    delete updateData.sawActivity;
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.profilePicture !== undefined) {
    updateData.profilePicture = normalizeAssetForWrite(data.profilePicture);
  }

  if (data.signature !== undefined) {
    updateData.signature = normalizeAssetForWrite(data.signature);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  if (data.role) {
    new SendAddRoleToUserSlackMessage(updatedUser).perform();
  }

  return withParsedAssets(updatedUser);
}

export const getUserData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Institutions: true,
    },
  });

  if (!user) return null;

  // Map Institutions to institution for backward compatibility
  return withParsedAssets({
    ...user,
    institution: normalizeInstitutionLogoForRead(user.Institutions),
  });
}

export const getAllInstitutionUsers = async (institutionId) => {
  const users = await prisma.user.findMany({
    where: {
      institutionId,
    },
  });

  return users;
}

export const getInstitutionPrincipals = async (institutionId) => {
  const users = await prisma.user.findMany({
    where: {
      role: 'principal',
      institutionId,
      deletedAt: null,
    },
  });

  return users.map(withParsedAssets);
}

export const getInstitutionCoordinators = async (institutionId) => {
  const users = await prisma.user.findMany({
    where: {
      role: 'coordinator',
      institutionId,
      deletedAt: null,
    },
  });

  return users.map(withParsedAssets);
}

export const getInstitutionTeachers = async (institutionId) => {
  const users = await prisma.user.findMany({
    where: {
      role: 'teacher',
      institutionId,
    },
  });

  return users;
}

export const getActiveInstitutionTeachersAndCoordinators = async (institutionId) => {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['teacher', 'coordinator'] },
      institutionId,
      deletedAt: null,
    },
  });

  return users;
}

export const getAllTeachers = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: 'teacher',
      institutionId: { not: null },
          },
    include: {
      Institutions: true,
    },
    take: 10000,
  });

  // Get classrooms with student counts
  const usersWithClassrooms = await Promise.all(
    users.map(async (user) => {
      const validClassrooms = await prisma.classes.findMany({
        where: {
          id: { in: user.classrooms },
          deletedAt: null,
        },
        include: {
          _count: {
            select: { students: true },
          },
        },
      });

      return {
        ...user,
        institution: normalizeInstitutionLogoForRead(user.Institutions),
        classrooms: validClassrooms.map(c => ({
          ...c,
          students: c._count.students,
        })),
      };
    })
  );

  return JSON.parse(JSON.stringify(usersWithClassrooms));
}

export const getAllPrincipals = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: 'principal',
      institutionId: { not: null },
      deletedAt: null,
    },
    include: {
      Institutions: true,
    },
    take: 10000,
  });

  return users;
}

export const getAllTeachersWithStatsInRange = async (startDate, endDate) => {
  const teachers = await prisma.user.findMany({
    where: {
      role: 'teacher',
      deletedAt: null,
      email: { not: null },
      firstName: { not: null },
    },
    take: 1000,
  });

  const statsPromises = teachers.map(async (teacher) => {
    const [plannedActivities, activities, observations, evaluations] = await Promise.all([
      prisma.plannedActivities.count({
        where: {
          teacherId: teacher.id,
          plannedDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          deletedAt: null,
        },
      }),
      prisma.activities.count({
        where: {
          creatorId: teacher.id,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          deletedAt: null,
        },
      }),
      prisma.observations.count({
        where: {
          teacherId: teacher.id,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          deletedAt: null,
        },
      }),
      prisma.evaluations.count({
        where: {
          teacherId: teacher.id,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      }),
    ]);

    // Create WeeklyTeachersStats record
    await prisma.weeklyTeachersStats.create({
      data: {
        teacherId: teacher.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        plannedActivities,
        activities,
        observations,
        evaluations,
      },
    });

    return {
      email: teacher.email,
      firstName: teacher.firstName,
      plannedActivities,
      activities,
      observations,
      evaluations,
    };
  });

  const stats = await Promise.all(statsPromises);
  return JSON.parse(JSON.stringify(stats));
}

export const getClassroomTeachers = async (classroomId) => {
  const users = await prisma.user.findMany({
    where: {
      classrooms: { has: classroomId },
      role: { in: ['teacher', 'coordinator'] },
    },
  });

  return users;
}

export const getUsersData = async (usersIds) => {
  const users = await prisma.user.findMany({
    where: {
      id: { in: usersIds },
    },
  });

  return users;
}

export const getRegisteredUsersWithDaysAgeEqualTo = async ({ ageInDays, withLevels = false }) => {
  const startOfDay = moment().subtract(ageInDays, 'days').startOf('day').toDate();
  const endOfDay = moment().subtract(ageInDays, 'days').endOf('day').toDate();

  const users = await prisma.user.findMany({
    where: {
      plan: 'free',
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: withLevels
      ? {
          Institutions: {
            include: {
              Classes: {
                where: {
                  id: { in: [] }, // Will be populated from user.classrooms
                },
                include: {
                  Levels: true,
                },
              },
            },
          },
        }
      : undefined,
    take: 100000,
  });

  if (withLevels) {
    const usersWithLevels = await Promise.all(
      users.map(async (user) => {
        const classrooms = await prisma.classes.findMany({
          where: {
            id: { in: user.classrooms },
          },
          include: {
            Levels: true,
          },
        });

        return {
          ...user,
          levelsIds: classrooms.map((c) => c.Levels.id),
        };
      })
    );

    return JSON.parse(JSON.stringify(usersWithLevels));
  }

  return users;
}

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    take: 100000,
  });

  return users;
}
