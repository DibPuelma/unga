import prisma from './prisma';
import { createBaseCoresForInstitution } from './core';
import { createBaseLevelsOfAchievementForInstitution } from './levelsOfAchievement';
import { EXISTING_FEATURES } from './feature';

export const getInstitution = async (institutionId) => {
  const institution = await prisma.institutions.findUnique({
    where: { id: institutionId },
  });

  return JSON.parse(JSON.stringify(institution));
};

export const getInstitutionWithConfiguration = async (institutionId) => {
  const institution = await prisma.institutions.findUnique({
    where: { id: institutionId },
    include: {
      users: {
        where: {
          role: { in: ['principal', 'coordinator'] },
        },
      },
    },
  });

  if (!institution) return null;

  const config = institution.configuration || {};
  const principal = config.employeesRoles?.principal
    ? await prisma.users.findUnique({ where: { id: config.employeesRoles.principal } })
    : null;
  const coordinator = config.employeesRoles?.coordinator
    ? await prisma.users.findUnique({ where: { id: config.employeesRoles.coordinator } })
    : null;

  const result = {
    ...institution,
    configuration: {
      report: config.report || null,
      activities: config.activities || null,
      print: config.print || null,
      employeesRoles: {
        principal: principal || null,
        coordinator: coordinator || null,
      },
    },
  };

  return JSON.parse(JSON.stringify(result));
}

export const getInstitutionWithStructure = async (institutionId) => {
  const institution = await prisma.institutions.findUnique({
    where: { id: institutionId },
    include: {
      Classes: {
        where: { deletedAt: null },
        include: {
          Levels: true,
          Students: {
            where: {
              deactivatedAt: null,
              deletedAt: null,
            },
          },
        },
      },
      Cores: true,
    },
  });

  if (!institution) return null;

  // Transform to lowercase for backward compatibility
  const result = {
    ...institution,
    classrooms: institution.Classes.map((c) => ({
      ...c,
      level: c.Levels,
      students: c.Students,
    })),
    cores: institution.Cores,
    classes: institution.Classes.map((c) => ({
      ...c,
      level: c.Levels,
      students: c.Students,
    })),
  };

  return JSON.parse(JSON.stringify(result));
}

export const createInstitution = async ({
  name,
  address,
  code,
  mobilePhone,
  webpage,
  country,
}) => {
  const institution = await prisma.institutions.create({
          data: {
            name,
            address,
            code,
            mobilePhone,
            webpage,
            country,
            features: EXISTING_FEATURES,
    },
  });

  // Create base cores and levels of achievement
  await createBaseCoresForInstitution(institution.id);
  await createBaseLevelsOfAchievementForInstitution(institution.id);

  return institution;
}

export const updateInstitution = async (institutionId, {
  configuration,
  name,
  address,
  code,
  junjiCode,
  mobilePhone,
  email,
  webpage,
  logo,
  features,
}) => {
  if (configuration) {
    if (configuration.employeesRoles?.coordinator) {
      const institution = await getInstitution(institutionId);
      const oldCoordinatorId = institution?.configuration?.employeesRoles?.coordinator;
      
      if (oldCoordinatorId) {
        await prisma.users.update({
          where: { id: oldCoordinatorId },
          data: { role: 'teacher' },
        });
      }

      await prisma.users.update({
        where: { id: configuration.employeesRoles.coordinator },
        data: { role: 'coordinator' },
      });
    }
  }

  const institution = await prisma.institutions.update({
    where: { id: institutionId },
      data: {
        configuration,
        name,
        address,
        code,
        junjiCode,
        mobilePhone,
        email,
        webpage,
        logo,
        features,
    },
  });

  return institution;
}
