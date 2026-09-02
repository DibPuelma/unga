/**
 * Merges duplicate user accounts that belong to the same person inside one institution.
 *
 * A person can end up with two rows in `users` (different emails, same institution and role)
 * after being loaded twice — e.g. once with the institution's own domain and once with an
 * @ungapp.com address. Because every lookup returns whichever row Postgres feels like returning
 * first, the app can pick the empty account: a report renders "X puede agregar su firma en su
 * perfil" even though X did upload a signature, but on the other account.
 *
 * This script keeps one row per person, repoints their content to it and soft-deletes the rest
 * (which is exactly what getInstitutionPrincipals/getInstitutionCoordinators already filter out).
 *
 * Billing and auth rows are never moved. If a duplicate has payments, subscriptions, cards or
 * credit transactions, that person is reported and skipped for manual review.
 *
 * Usage:
 *   node scripts/merge-duplicate-institution-users.js                          # dry run, reports only
 *   node scripts/merge-duplicate-institution-users.js --institution=<id>       # scope to one institution
 *   node scripts/merge-duplicate-institution-users.js --institution=<id> --apply
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const INSTITUTION_ID = process.argv
  .find((arg) => arg.startsWith('--institution='))
  ?.split('=')[1];

// Content owned by the person. Every row is repointed to the account we keep.
const CONTENT_REFERENCES = [
  { delegate: 'observations', field: 'teacherId' },
  { delegate: 'activities', field: 'creatorId' },
  { delegate: 'activities', field: 'updatedById' },
  { delegate: 'attendances', field: 'teacherId' },
  { delegate: 'classes', field: 'mainTeacherId' },
  { delegate: 'downloadedStudentsReports', field: 'downloadedById' },
  { delegate: 'evaluations', field: 'teacherId' },
  { delegate: 'evaluations', field: 'updatedById' },
  { delegate: 'objectives', field: 'createdById' },
  { delegate: 'subObjectives', field: 'createdById' },
  { delegate: 'subObjectivesEvaluations', field: 'teacherId' },
  { delegate: 'plannedActivities', field: 'teacherId' },
  { delegate: 'plannedActivities', field: 'deletedById' },
  { delegate: 'plannedActivitiesEvaluations', field: 'teacherId' },
  { delegate: 'reports', field: 'teacherId' },
  { delegate: 'openAIApiCalls', field: 'userId' },
];

// Moving money across accounts is never safe to automate.
const BILLING_REFERENCES = [
  { delegate: 'payments', field: 'userId' },
  { delegate: 'subscriptions', field: 'userId' },
  { delegate: 'registeredCards', field: 'userId' },
  { delegate: 'creditTransactions', field: 'userId' },
];

const DIACRITICS = /[\u0300-\u036f]/g;

const normalizeName = (user) => `${user.firstName || ''} ${user.lastName || ''}`
  .normalize('NFD')
  .replace(DIACRITICS, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

// The account with a signature wins: it is the one the person actually set up. Then the most
// recently touched, then the oldest, so the result never depends on row order.
const pickSurvivor = (duplicates) => [...duplicates].sort((a, b) => {
  if (Boolean(a.signature) !== Boolean(b.signature)) return a.signature ? -1 : 1;
  if (a.updatedAt.getTime() !== b.updatedAt.getTime()) return b.updatedAt - a.updatedAt;
  return a.createdAt - b.createdAt;
})[0];

const countReferences = async (references, userIds) => {
  const counts = {};
  for (const { delegate, field } of references) {
    const count = await prisma[delegate].count({ where: { [field]: { in: userIds } } });
    if (count > 0) counts[`${delegate}.${field}`] = count;
  }
  return counts;
};

const countContentReferences = async (userIds) => {
  const counts = await countReferences(CONTENT_REFERENCES, userIds);
  const [{ n }] = await prisma.$queryRaw`
    SELECT count(*)::int AS n FROM "_UpdatedBy" WHERE "B" = ANY(${userIds})
  `;
  if (n > 0) counts['_UpdatedBy.B'] = n;
  return counts;
};

const mergeGroup = async (survivor, discarded) => {
  const discardedIds = discarded.map((user) => user.id);

  await prisma.$transaction(async (tx) => {
    for (const { delegate, field } of CONTENT_REFERENCES) {
      await tx[delegate].updateMany({
        where: { [field]: { in: discardedIds } },
        data: { [field]: survivor.id },
      });
    }

    // Implicit many-to-many (Reports <-> users). Insert-then-delete instead of a plain update so
    // reports already linked to the survivor don't violate the (A, B) unique index.
    await tx.$executeRaw`
      INSERT INTO "_UpdatedBy" ("A", "B")
      SELECT "A", ${survivor.id} FROM "_UpdatedBy" WHERE "B" = ANY(${discardedIds})
      ON CONFLICT DO NOTHING
    `;
    await tx.$executeRaw`DELETE FROM "_UpdatedBy" WHERE "B" = ANY(${discardedIds})`;

    await tx.user.update({
      where: { id: survivor.id },
      data: {
        classrooms: [...new Set(discarded.flatMap((user) => user.classrooms).concat(survivor.classrooms))],
        seenActivities: [...new Set(discarded.flatMap((user) => user.seenActivities).concat(survivor.seenActivities))],
        // pickSurvivor already prefers whoever has a signature, so only the optional fields
        // still need to be pulled over from the accounts we are about to discard.
        profilePicture: survivor.profilePicture
          || discarded.find((user) => user.profilePicture)?.profilePicture
          || null,
        phoneNumber: survivor.phoneNumber || discarded.find((user) => user.phoneNumber)?.phoneNumber || null,
      },
    });

    await tx.user.updateMany({
      where: { id: { in: discardedIds } },
      data: { deletedAt: new Date() },
    });
  }, { timeout: 30000 });
};

async function main() {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      institutionId: INSTITUTION_ID || { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      role: true,
      institutionId: true,
      signature: true,
      profilePicture: true,
      classrooms: true,
      seenActivities: true,
      createdAt: true,
      updatedAt: true,
      Institutions: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const groups = new Map();
  users.forEach((user) => {
    const key = `${user.institutionId}|${user.role}|${normalizeName(user)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(user);
  });

  const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('No duplicate accounts found.');
    return;
  }

  let merged = 0;
  let skipped = 0;

  for (const group of duplicateGroups) {
    const survivor = pickSurvivor(group);
    const discarded = group.filter((user) => user.id !== survivor.id);
    const [{ Institutions, firstName, lastName, role }] = group;

    console.log(`\n${Institutions?.name || group[0].institutionId} — ${firstName} ${lastName} (${role})`);
    console.log(`  keep    ${survivor.id}  ${survivor.email}  ${survivor.signature ? '[firma]' : ''}`);
    discarded.forEach((user) => console.log(`  discard ${user.id}  ${user.email}`));

    const billing = await countReferences(BILLING_REFERENCES, discarded.map((user) => user.id));
    if (Object.keys(billing).length > 0) {
      console.log(`  SKIPPED — the discarded accounts have billing rows: ${JSON.stringify(billing)}`);
      skipped += 1;
      continue;
    }

    const content = await countContentReferences(discarded.map((user) => user.id));
    console.log(`  moves   ${Object.keys(content).length > 0 ? JSON.stringify(content) : 'nothing'}`);

    if (APPLY) {
      await mergeGroup(survivor, discarded);
      console.log('  merged');
    }
    merged += 1;
  }

  console.log(
    `\n${APPLY ? 'Merged' : 'Would merge'} ${merged} duplicate group(s), skipped ${skipped}.`,
  );
  if (!APPLY) console.log('Dry run. Re-run with --apply to write the changes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
