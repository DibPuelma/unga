import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dm3pbgdzl',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// delete_resources accepts at most 100 public_ids per call.
const DESTROY_BATCH_SIZE = 100;

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export default class CloudinaryService {
  static async upload(file) {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
    });
    return result;
  }

  /**
   * Best-effort delete of a single asset. Never throws: callers are user-facing
   * writes that must not fail because Cloudinary is unreachable. Anything missed
   * here is picked up later by the cloudinary-cleanup cron.
   */
  static async destroy(publicId, { resourceType = 'image' } = {}) {
    if (!publicId) return null;

    try {
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (e) {
      console.error(`CloudinaryService.destroy failed for ${publicId}:`, e.message);
      return null;
    }
  }

  /** Same as destroy, but takes the stored Cloudinary asset object (or its JSON string). */
  static async destroyAsset(asset) {
    const parsed = parseAsset(asset);
    if (!parsed?.public_id) return null;

    return CloudinaryService.destroy(parsed.public_id, { resourceType: parsed.resource_type });
  }

  /**
   * Drops the asset a field used to hold once it has been replaced or cleared.
   * No-op when there was nothing there before or when the same asset is re-saved,
   * so it is safe to call on every write.
   */
  static async destroyIfReplaced(previous, next) {
    const parsed = parseAsset(previous);
    if (!parsed?.public_id) return null;
    if (parsed.public_id === parseAsset(next)?.public_id) return null;

    return CloudinaryService.destroy(parsed.public_id, { resourceType: parsed.resource_type });
  }

  /** Bulk delete, grouped by resource_type and chunked to the API limit. */
  static async destroyMany(assets) {
    const byType = new Map();
    for (const { publicId, resourceType = 'image' } of assets) {
      if (!publicId) continue;
      if (!byType.has(resourceType)) byType.set(resourceType, []);
      byType.get(resourceType).push(publicId);
    }

    let deleted = 0;
    const errors = [];
    for (const [resourceType, publicIds] of byType) {
      for (const batch of chunk(publicIds, DESTROY_BATCH_SIZE)) {
        try {
          const res = await cloudinary.api.delete_resources(batch, { resource_type: resourceType });
          deleted += Object.values(res.deleted || {}).filter((v) => v === 'deleted').length;
        } catch (e) {
          errors.push(`${resourceType}: ${e.message}`);
        }
      }
    }

    return { deleted, errors };
  }

  /** Every asset uploaded on or after `since` (ISO date string), paginated. */
  static async listUploadedSince(since) {
    const assets = [];
    let cursor;

    do {
      let search = cloudinary.search
        .expression(`uploaded_at>${since}`)
        .max_results(500);
      if (cursor) search = search.next_cursor(cursor);

      const page = await search.execute();
      for (const r of page.resources || []) {
        assets.push({
          publicId: r.public_id,
          resourceType: r.resource_type,
          bytes: r.bytes || 0,
          createdAt: r.created_at,
        });
      }
      cursor = page.next_cursor;
    } while (cursor);

    return assets;
  }
}

/** Stored assets are Cloudinary objects, sometimes JSON-stringified into a TEXT column. */
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
