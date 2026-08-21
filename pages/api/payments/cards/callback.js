import { finishInscription } from 'services/transbank/oneclick';
import { approveCard, getCardByRegistrationToken, rejectCard } from 'db/registeredCard';
import { getUserData } from 'db/user';
import SubscriptionService, { ChargeRejectedError } from 'services/SubscriptionService';

// Transbank redirects the browser back here with TBK_TOKEN after the hosted
// card-registration form. No session assumptions: identity comes from the
// pending card row created at inscription start.
export default async function handler(req, res) {
  const token = req.query.TBK_TOKEN || req.body?.TBK_TOKEN;
  const intent = req.query.intent === 'subscribe' ? 'subscribe' : 'card_only';

  if (!token) return res.redirect('/payments/subscription-result?status=aborted');

  const card = await getCardByRegistrationToken(token);
  if (!card) return res.redirect('/payments/subscription-result?status=unknown');
  if (card.status !== 'pending') {
    return res.redirect('/payments/subscription-result?status=already_processed');
  }

  let inscription;
  try {
    inscription = await finishInscription(token);
  } catch (e) {
    console.error('finishInscription failed:', e);
    await rejectCard(card.id, 'finish_error');
    return res.redirect('/payments/subscription-result?status=rejected');
  }

  if (inscription.responseCode !== 0) {
    await rejectCard(card.id, inscription.responseCode);
    return res.redirect('/payments/subscription-result?status=rejected');
  }

  const user = await getUserData(card.userId);
  const approvedCard = await approveCard(card.id, {
    tbkUser: inscription.tbkUser,
    oneclickRegistrationEmail: user.email,
    authorizationCode: inscription.authorizationCode,
    cardType: inscription.cardType,
    cardNumber: inscription.cardNumber?.slice(-4),
  });

  if (intent !== 'subscribe') {
    return res.redirect('/payments/subscription-result?status=card_registered');
  }

  try {
    await SubscriptionService.activateSubscription(user, approvedCard);
    return res.redirect('/payments/subscription-result?status=subscribed');
  } catch (e) {
    if (e instanceof ChargeRejectedError) {
      // Card registered but the prorated first charge was rejected.
      return res.redirect(`/payments/subscription-result?status=charge_rejected&code=${e.responseCode}`);
    }
    console.error('activateSubscription failed:', e);
    return res.redirect('/payments/subscription-result?status=error');
  }
}
