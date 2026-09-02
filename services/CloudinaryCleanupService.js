import prisma from 'db/prisma';
import CloudinaryService from 'services/CloudinaryService';

/**
 * The platform was relaunched on a fresh database in 2026; everything uploaded
 * before this date belongs to the previous incarnation and is NOT covered by the
 * reference scan below. The sweep must never touch it — reclaiming that legacy
 * storage is a separate, deliberate one-off decision.
 */
const RELAUNCH_DATE = '2026-01-01';

/**
 * The upload widget pushes to Cloudinary before the surrounding form is saved, so
 * a freshly uploaded asset is legitimately unreferenced for a while. Only sweep
 * assets that have been orphaned for longer than this.
 */
const GRACE_PERIOD_DAYS = 7;

/** Abort if the reference scan returns implausibly few rows — see assertReferencesLookSane. */
const MIN_EXPECTED_REFERENCES = 1000;

/** Never delete more than this in a single run; a bigger number means something is wrong. */
const MAX_DELETIONS_PER_RUN = 500;

const publicIdOf = (value) => {
  if (!value) return null;
  const asset = typeof value === 'string' ? safeParse(value) : value;
  return asset?.public_id || null;
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

/**
 * Every public_id the app still points at. Soft-deleted rows are included on
 * purpose: a soft delete is reversible, so its assets are still spoken for.
 */
const collectReferencedPublicIds = async () => {
  const referenced = new Set();
  const add = (value) => {
    const id = publicIdOf(value);
    if (id) referenced.add(id);
  };

  const [observations, activities, institutions, students, users] = await Promise.all([
    prisma.observations.findMany({ select: { assets: true } }),
    prisma.activities.findMany({ select: { assets: true } }),
    prisma.institutions.findMany({ select: { logo: true } }),
    prisma.students.findMany({ select: { profilePicture: true } }),
    prisma.user.findMany({ select: { profilePicture: true, signature: true } }),
  ]);

  // Observations.assets is TEXT[] of JSON-stringified Cloudinary objects.
  for (const { assets } of observations) {
    for (const item of assets || []) add(item);
  }

  // Activities.assets is a JSON object keyed by asset_id.
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
};

/**
 * The failure mode that matters: a scan that silently returns few or no rows
 * (wrong database, failed query, mid-migration) would mark every live asset as
 * an orphan and delete the whole account. Refuse to proceed on a thin result.
 */
const assertReferencesLookSane = (referenced) => {
  if (referenced.size < MIN_EXPECTED_REFERENCES) {
    throw new Error(
      `Reference scan returned only ${referenced.size} public_ids (expected at least ` +
      `${MIN_EXPECTED_REFERENCES}). Refusing to sweep — this usually means the scan ` +
      `hit the wrong database or a query failed.`,
    );
  }
};

/**
 * Deletes Cloudinary assets uploaded since the relaunch that no DB row points at:
 * abandoned uploads, replaced avatars/logos, and the redundant copies left behind
 * when the upload widget fires twice.
 */
export default class CloudinaryCleanupService {
  static async sweepOrphans({ apply = false } = {}) {
    const referenced = await collectReferencedPublicIds();
    assertReferencesLookSane(referenced);

    const assets = await CloudinaryService.listUploadedSince(RELAUNCH_DATE);
    const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const orphans = assets.filter(
      (a) => !referenced.has(a.publicId) && new Date(a.createdAt) < cutoff,
    );

    const truncated = orphans.length > MAX_DELETIONS_PER_RUN;
    const batch = truncated ? orphans.slice(0, MAX_DELETIONS_PER_RUN) : orphans;
    const reclaimedBytes = batch.reduce((sum, a) => sum + a.bytes, 0);

    const summary = {
      apply,
      scanned: assets.length,
      referenced: referenced.size,
      orphansFound: orphans.length,
      selected: batch.length,
      truncated,
      reclaimedMB: +(reclaimedBytes / 1024 / 1024).toFixed(1),
    };

    if (truncated) {
      console.warn(
        `cloudinary-cleanup: ${orphans.length} orphans found, capped at ${MAX_DELETIONS_PER_RUN} ` +
        `this run. The rest will be picked up tomorrow.`,
      );
    }

    if (!apply) {
      console.log('cloudinary-cleanup (dry run):', summary);
      return { ...summary, deleted: 0, sample: batch.slice(0, 10).map((a) => a.publicId) };
    }

    const { deleted, errors } = await CloudinaryService.destroyMany(batch);
    console.log('cloudinary-cleanup:', { ...summary, deleted, errors });

    return { ...summary, deleted, errors };
  }
}
