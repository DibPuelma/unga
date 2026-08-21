import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getActivity } from 'db/activity';
import PuppeteerService from 'services/PuppeteerService';
import { buildActivityHtml } from 'services/ActivityPdfService';

export const config = { maxDuration: 60 };

const slugify = (name) =>
  (name || 'experiencia')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.id) return res.status(401).end();

  const { institutionId, activityId } = req.query;
  const activity = await getActivity(activityId);
  if (!activity) return res.status(404).end();

  const sponsorId = activity.sponsorInstitutionId
    || activity.Institutions_Activities_sponsorInstitutionIdToInstitutions?.id;
  const isOwnInstitution = user.institution?.id === institutionId && sponsorId === institutionId;
  if (!activity.publiclyAvailable && !isOwnInstitution && user.role !== 'superAdmin') {
    return res.status(403).end();
  }

  try {
    const html = buildActivityHtml(activity);
    const buffer = await new PuppeteerService().pdfFromHtmlAsBuffer(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${slugify(activity.name)}.pdf"`);
    return res.status(200).send(buffer);
  } catch (e) {
    console.error('activity pdf failed:', e);
    return res.status(502).json({ error: 'pdf_failed' });
  }
}
