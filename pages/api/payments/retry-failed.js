import SubscriptionService from 'services/SubscriptionService';

// Daily cron: retry payment_failed subscriptions whose nextRetryAt is due.
export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  try {
    const result = await SubscriptionService.retryFailed();
    return res.status(200).json(result);
  } catch (e) {
    console.error('retry-failed failed:', e);
    return res.status(500).json({ error: e.message });
  }
}
