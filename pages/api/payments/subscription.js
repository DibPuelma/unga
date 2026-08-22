import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import SubscriptionService from 'services/SubscriptionService';
import { getActiveSubscriptionForUser } from 'db/subscription';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.id) return res.status(401).end();

  if (req.method === 'GET') {
    const subscription = await getActiveSubscriptionForUser(user.id);
    return res.status(200).json({ subscription });
  }

  if (req.method === 'DELETE') {
    const subscription = await SubscriptionService.cancelAtPeriodEnd(user.id);
    if (!subscription) return res.status(404).json({ error: 'no_active_subscription' });
    return res.status(200).json({ subscription });
  }

  if (req.method === 'PATCH') {
    const subscription = await SubscriptionService.resumeSubscription(user.id);
    if (!subscription) return res.status(404).json({ error: 'no_pending_cancellation' });
    return res.status(200).json({ subscription });
  }

  return res.status(405).end();
}
