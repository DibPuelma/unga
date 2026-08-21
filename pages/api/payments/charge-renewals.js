import SubscriptionService from 'services/SubscriptionService';

// Cron (1st of each month): charge $4.990 to every active subscription due.
// Also acts as a catch-up sweep: currentPeriodEnd <= now covers missed runs.
export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  try {
    const result = await SubscriptionService.chargeRenewals();
    return res.status(200).json(result);
  } catch (e) {
    console.error('charge-renewals failed:', e);
    return res.status(500).json({ error: e.message });
  }
}
