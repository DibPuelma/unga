import { getInstitutionCalendarEvents } from 'db/institutionCalendarEvent';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { institutionAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const { query: { institutionId, startDate, endDate } } = req;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user } = session;

  if (!(await institutionAuthorization(user, institutionId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const events = await getInstitutionCalendarEvents(institutionId, startDate, endDate);
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return res.status(500).json({ error: error.message });
  }
};

