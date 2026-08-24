import crypto from 'crypto';

// THE shared deduplication key.
//
// Meta collapses a browser Pixel event and a Conversions API event into a
// single conversion only when event_name AND event_id match. This module is
// the single place where that id is built: the server derives it, sends it to
// the Graph API, and hands the very same string back to the browser in the
// API response so the Pixel fires with `{ eventID }` set to it.
//
// It is derived (not random) from the internal id of the conversion, so a
// retry — a resent request, a replayed webhook, a re-run of the handler —
// produces the same event_id and Meta still counts one event. For the B2C
// trial the internal id is the user id: db/credits.js keys the signup grant on
// `CreditTransactions.relatedId = userId` + `reason = 'signup_grant'`, so user
// id and trial id are the same thing here.

const buildDeterministicUuid = (namespace, key) => {
  const hash = crypto.createHash('sha256').update(`${namespace}:${key}`).digest('hex');

  // Format the first 128 bits as a canonical UUID string. The version (4) and
  // variant nibbles are pinned so the value is a well-formed UUID, which is
  // what Meta's docs recommend for event_id.
  const variantNibble = ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${variantNibble}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
};

export const buildTrialStartedEventId = (userId) => (
  buildDeterministicUuid('unga:start_trial', userId)
);
