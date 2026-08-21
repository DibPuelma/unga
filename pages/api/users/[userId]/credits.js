import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import CreditsService from 'services/CreditsService';
import { getActiveSubscriptionForUser } from 'db/subscription';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const { userId } = req.query;

  if (!session?.user?.id) return res.status(401).end();
  if (session.user.id !== userId && session.user.role !== 'superAdmin') {
    return res.status(403).end();
  }

  const credits = await CreditsService.getCreditsForUser(userId);
  if (!credits) return res.status(404).end();

  const subscription = await getActiveSubscriptionForUser(userId);

  res.status(200).json({
    ...credits,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
  });
}
