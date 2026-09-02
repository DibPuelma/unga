/**
 * Deletes the Cloudinary assets left over from the platform's previous incarnation.
 *
 * The platform was relaunched in 2026 on a fresh database. Everything uploaded before
 * that belongs to the old system: 18k assets / ~19 GB that nothing in the current
 * database points at, sitting on a plan whose storage quota is measured on the current
 * total (it never ages out on its own).
 *
 * Two independent conditions must BOTH hold before an asset is deleted:
 *   1. It was uploaded before RELAUNCH_DATE.
 *   2. No row in the current database references its public_id.
 *
 * Condition 2 is not redundant. The whole premise is that pre-relaunch assets are
 * unreferenced — if that turns out to be false for even one asset, the premise is wrong
 * and the script says so instead of deleting it.
 *
 * Usage:
 *   node scripts/purge-legacy-cloudinary-assets.js                 # dry run, reports only
 *   node scripts/purge-legacy-cloudinary-assets.js --limit=100     # dry run, first 100 only
 *   node scripts/purge-legacy-cloudinary-assets.js --apply         # deletes
 *   node scripts/purge-legacy-cloudinary-assets.js --apply --limit=100
 *
 * Requires DATABASE_URL, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the environment:
 *   set -a && . ./.env && set +a && node scripts/purge-legacy-cloudinary-assets.js
 */
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

const RELAUNCH_DATE = '2026-01-01';

/** Abort if the reference scan returns implausibly few rows — see assertReferencesLookSane. */
const MIN_EXPECTED_REFERENCES = 1000;

/** delete_resources accepts at most 100 public_ids per call. */
const DESTROY_BATCH_SIZE = 100;

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith('--limit='));
  return arg ? parseInt(arg.split('=')[1], 10) : Infinity;
})();

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dm3pbgdzl',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const GB = 1024 ** 3;
const parseAsset = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

/**
 * Every public_id the current app still points at. Soft-deleted rows are included on
 * purpose: a soft delete is reversible, so its assets are still spoken for.
 */
async function collectReferencedPublicIds() {
  const referenced = new Set();
  const add = (value) => {
    const id = parseAsset(value)?.public_id;
    if (id) referenced.add(id);
  };

  const [observations, activities, institutions, students, users] = await Promise.all([
    prisma.observations.findMany({ select: { assets: true } }),
    prisma.activities.findMany({ select: { assets: true } }),
    prisma.institutions.findMany({ select: { logo: true } }),
    prisma.students.findMany({ select: { profilePicture: true } }),
    prisma.user.findMany({ select: { profilePicture: true, signature: true } }),
  ]);

  for (const { assets } of observations) for (const item of assets || []) add(item);
  for (const { assets } of activities) {
    if (assets && typeof assets === 'object') Object.values(assets).forEach(add);
  }
  institutions.forEach(({ logo }) => add(logo));
  students.forEach(({ profilePicture }) => add(profilePicture));
  users.forEach(({ profilePicture, signature }) => {
    add(profilePicture);
    add(signature);
  });

  return referenced;
}

/**
 * A scan that silently returns few or no rows (wrong database, failed query,
 * mid-migration) would mark every asset as legacy and delete the whole account.
 */
function assertReferencesLookSane(referenced) {
  if (referenced.size < MIN_EXPECTED_REFERENCES) {
    throw new Error(
      `Reference scan returned only ${referenced.size} public_ids (expected at least ` +
      `${MIN_EXPECTED_REFERENCES}). Refusing to purge — this usually means the scan hit ` +
      `the wrong database or a query failed.`,
    );
  }
}

async function listUploadedBefore(date) {
  const assets = [];
  let cursor;

  do {
    let search = cloudinary.search.expression(`uploaded_at<${date}`).max_results(500);
    if (cursor) search = search.next_cursor(cursor);

    const page = await search.execute();
    for (const r of page.resources || []) {
      assets.push({
        publicId: r.public_id,
        resourceType: r.resource_type,
        format: r.format,
        bytes: r.bytes || 0,
        createdAt: r.created_at,
      });
    }
    cursor = page.next_cursor;
    process.stdout.write(`\r  scanning Cloudinary… ${assets.length} assets`);
  } while (cursor);

  process.stdout.write('\n');
  return assets;
}

function reportBreakdown(assets) {
  const byFormat = new Map();
  for (const a of assets) {
    const key = `${a.resourceType}/${a.format || '-'}`;
    const entry = byFormat.get(key) || { count: 0, bytes: 0 };
    entry.count += 1;
    entry.bytes += a.bytes;
    byFormat.set(key, entry);
  }

  console.log('\n  by type:');
  [...byFormat.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .forEach(([key, { count, bytes }]) =>
      console.log(`    ${key.padEnd(16)} ${String(count).padStart(6)} assets  ${(bytes / GB).toFixed(2)} GB`),
    );
}

async function main() {
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — purging Cloudinary assets uploaded before ${RELAUNCH_DATE}\n`);

  const referenced = await collectReferencedPublicIds();
  assertReferencesLookSane(referenced);
  console.log(`  database references ${referenced.size} public_ids`);

  const legacy = await listUploadedBefore(RELAUNCH_DATE);

  // The premise is that nothing pre-relaunch is referenced. Verify it rather than assume it.
  const stillReferenced = legacy.filter((a) => referenced.has(a.publicId));
  if (stillReferenced.length) {
    console.log(
      `\n  ⚠️  ${stillReferenced.length} pre-${RELAUNCH_DATE} assets ARE still referenced by the ` +
      `current database and will be kept:`,
    );
    stillReferenced.slice(0, 20).forEach((a) => console.log(`      ${a.publicId}`));
    if (stillReferenced.length > 20) console.log(`      … and ${stillReferenced.length - 20} more`);
  }

  const orphaned = legacy.filter((a) => !referenced.has(a.publicId));
  const totalBytes = orphaned.reduce((sum, a) => sum + a.bytes, 0);

  console.log(`\n  legacy assets found : ${legacy.length}`);
  console.log(`  kept (referenced)   : ${stillReferenced.length}`);
  console.log(`  to delete           : ${orphaned.length}  (${(totalBytes / GB).toFixed(2)} GB = ${(totalBytes / GB).toFixed(2)} credits)`);
  reportBreakdown(orphaned);

  const batch = Number.isFinite(LIMIT) ? orphaned.slice(0, LIMIT) : orphaned;
  if (batch.length !== orphaned.length) {
    console.log(`\n  --limit=${LIMIT} → only the first ${batch.length} will be processed this run`);
  }

  if (!APPLY) {
    console.log('\n  sample:');
    batch.slice(0, 10).forEach((a) =>
      console.log(`    ${a.publicId.padEnd(34)} ${a.resourceType}/${a.format} ${(a.bytes / 1024 / 1024).toFixed(1)} MB ${a.createdAt.slice(0, 10)}`),
    );
    console.log('\n  DRY RUN — nothing deleted. Re-run with --apply to delete.');
    return;
  }

  const byType = new Map();
  for (const { publicId, resourceType } of batch) {
    if (!byType.has(resourceType)) byType.set(resourceType, []);
    byType.get(resourceType).push(publicId);
  }

  let deleted = 0;
  for (const [resourceType, publicIds] of byType) {
    for (let i = 0; i < publicIds.length; i += DESTROY_BATCH_SIZE) {
      const chunk = publicIds.slice(i, i + DESTROY_BATCH_SIZE);
      try {
        const res = await cloudinary.api.delete_resources(chunk, { resource_type: resourceType });
        deleted += Object.values(res.deleted || {}).filter((v) => v === 'deleted').length;
        process.stdout.write(`\r  deleting… ${deleted}/${batch.length}`);
      } catch (e) {
        console.error(`\n  batch failed (${resourceType}): ${e.message}`);
      }
    }
  }

  console.log(`\n\n  deleted ${deleted} assets, reclaimed ~${(totalBytes / GB).toFixed(2)} GB`);
}

main()
  .catch((e) => {
    console.error('\npurge-legacy-cloudinary-assets failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
