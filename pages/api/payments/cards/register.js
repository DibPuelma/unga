import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { startInscription } from 'services/transbank/oneclick';
import { createPendingCard } from 'db/registeredCard';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.id) return res.status(401).end();

  const intent = req.body?.intent === 'subscribe' ? 'subscribe' : 'card_only';
  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
  const responseUrl = `${baseUrl}/api/payments/cards/callback?intent=${intent}`;

  try {
    const { token, url } = await startInscription(user.email, responseUrl);
    await createPendingCard({ userId: user.id, registrationToken: token });
    return res.status(200).json({ token, url });
  } catch (e) {
    console.error('startInscription failed:', e);
    return res.status(502).json({ error: 'inscription_failed' });
  }
}
