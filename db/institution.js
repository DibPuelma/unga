import prisma from './prisma';
import { createBaseCoresForInstitution } from './core';
import { createBaseLevelsOfAchievementForInstitution } from './levelsOfAchievement';
import { EXISTING_FEATURES } from './feature';
import CloudinaryService from 'services/CloudinaryService';

const normalizeLogoForWrite = (logo) => {
  if (logo === undefined) return undefined;
  if (logo === null) return null;

  if (typeof logo === 'string') return logo;
  if (typeof logo === 'object') return JSON.stringify(logo);

  return null;
};

const normalizeLogoForRead = (logo) => {
  if (!logo) return logo;
  if (typeof logo === 'object') return logo;
  if (typeof logo !== 'string') return null;

  try {
    return JSON.parse(logo);
  } catch (_) {
    return logo;
  }
};

export const getInstitution = async (institutionId) => {
  const institution = await prisma.institutions.findUnique({
    where: { id: institutionId },
  });

  if (!institution) return null;

  institution.logo = normalizeLogoForRead(institution.logo);

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

  institution.logo = normalizeLogoForRead(institution.logo);

  const config = institution.configuration || {};
  const principal = config.employeesRoles?.principal
    ? await prisma.user.findUnique({ where: { id: config.employeesRoles.principal } })
    : null;
  const coordinator = config.employeesRoles?.coordinator
    ? await prisma.user.findUnique({ where: { id: config.employeesRoles.coordinator } })
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

  institution.logo = normalizeLogoForRead(institution.logo);

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

// Lean variant of getInstitutionWithStructure for callers that only need the
// institution's cores (e.g. progress calculations), avoiding the unbounded
// nested Classes -> Students fetch.
export const getInstitutionCores = async (institutionId) => {
  const institution = await prisma.institutions.findUnique({
    where: { id: institutionId },
    select: { Cores: true },
  });

  if (!institution) return null;

  return JSON.parse(JSON.stringify(institution.Cores));
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
  const normalizedLogo = normalizeLogoForWrite(logo);

  if (configuration) {
    if (configuration.employeesRoles?.coordinator) {
      const institution = await getInstitution(institutionId);
      const oldCoordinatorId = institution?.configuration?.employeesRoles?.coordinator;
      
      if (oldCoordinatorId) {
        await prisma.user.update({
          where: { id: oldCoordinatorId },
          data: { role: 'teacher' },
        });
      }

      await prisma.user.update({
        where: { id: configuration.employeesRoles.coordinator },
        data: { role: 'coordinator' },
      });
    }
  }

  // Snapshot the logo we are about to overwrite so we can drop it afterwards.
  const previous = normalizedLogo !== undefined
    ? await prisma.institutions.findUnique({ where: { id: institutionId }, select: { logo: true } })
    : null;

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
        logo: normalizedLogo,
        features,
    },
  });

  if (previous) {
    await CloudinaryService.destroyIfReplaced(previous.logo, institution.logo);
  }

  return institution;
}
