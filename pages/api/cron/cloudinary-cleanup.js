import CloudinaryCleanupService from 'services/CloudinaryCleanupService';

// Daily cron: delete Cloudinary assets no DB row points at anymore.
//
// Deletes by default. Vercel does not document query strings on cron paths, so gating
// deletion behind ?apply=true would risk the job silently no-opping forever; the opt-out
// is explicit instead. Pass ?dryRun=true to inspect what a run would delete.
export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  try {
    const result = await CloudinaryCleanupService.sweepOrphans({
      apply: req.query.dryRun !== 'true',
    });
    return res.status(200).json(result);
  } catch (e) {
    console.error('cloudinary-cleanup failed:', e);
    return res.status(500).json({ error: e.message });
  }
}
