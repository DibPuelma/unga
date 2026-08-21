import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import SubscriptionService, { ChargeRejectedError } from 'services/SubscriptionService';
import { getActiveSubscriptionForUser } from 'db/subscription';
import { getActiveCardForUser } from 'db/registeredCard';

const MAX_PACKS_PER_PURCHASE = 50;

// Instant Oneclick charge to the registered card — subscribers only.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.id) return res.status(401).end();

  const packs = Number.parseInt(req.body?.packs, 10);
  if (!Number.isInteger(packs) || packs < 1 || packs > MAX_PACKS_PER_PURCHASE) {
    return res.status(400).json({ error: 'invalid_packs' });
  }

  const subscription = await getActiveSubscriptionForUser(user.id);
  if (!subscription) return res.status(403).json({ error: 'subscription_required' });

  const card = await getActiveCardForUser(user.id);
  if (!card) return res.status(403).json({ error: 'card_required' });

  try {
    const { payment, creditsGranted } = await SubscriptionService.purchaseCreditPack(user, card, packs);
    return res.status(200).json({ paymentId: payment.id, creditsGranted });
  } catch (e) {
    if (e instanceof ChargeRejectedError) {
      return res.status(402).json({ error: 'charge_rejected', userMessage: e.userMessage });
    }
    console.error('purchaseCreditPack failed:', e);
    return res.status(502).json({ error: 'purchase_failed' });
  }
}
