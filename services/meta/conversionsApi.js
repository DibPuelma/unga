import crypto from 'crypto';

import { META_EVENTS, TRIAL_CUSTOM_DATA } from 'src/helpers/metaPixel';
import { getConversionsApiConfig } from './config';

// Server-side half of the Meta conversion tracking: POST /{pixel_id}/events.
//
// It exists because the browser Pixel is blocked by ad blockers, ITP and
// tracking-protection defaults for a large share of traffic. The server always
// sees the conversion, so CAPI is the reliable signal and the Pixel is the
// enrichment. Both carry the same event_id, so Meta counts one conversion.
//
// Nothing in here is allowed to throw: signup must succeed even if Meta is
// down, misconfigured or slow.

// Short enough that a Meta outage cannot noticeably slow signup, long enough
// that the normal ~200-400ms round trip completes. We await (rather than
// leaving a dangling promise) because on Vercel the lambda is frozen as soon
// as the response is sent, which silently drops fire-and-forget requests.
const REQUEST_TIMEOUT_MS = 3000;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Meta hashes its own copy of the user data after normalizing it. If we skip
// the normalization the hashes never line up and Event Match Quality stays at
// zero, so the rules below are not cosmetic.
const normalizeEmail = (value) => value.trim().toLowerCase();
// Digits only, country code included, no '+' or separators.
const normalizePhone = (value) => value.replace(/\D/g, '');
// Lowercase letters only (accents kept, punctuation and spaces dropped).
const normalizeName = (value) => value.trim().toLowerCase().replace(/[^\p{L}\p{M}]/gu, '');
// external_id needs no normalization beyond trimming — it is an opaque id.
const normalizeExternalId = (value) => value.trim();

const hashed = (value, normalize) => {
  if (value === undefined || value === null) return undefined;
  const normalized = normalize(String(value));
  return normalized ? sha256(normalized) : undefined;
};

const withoutEmptyValues = (object) => (
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null))
);

// On Vercel the real client IP is the first entry of x-forwarded-for; the
// socket address belongs to the proxy.
const extractClientIp = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const rawForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (rawForwarded) return rawForwarded.split(',')[0].trim();
  return req?.headers?.['x-real-ip'] || req?.socket?.remoteAddress || undefined;
};

// Everything Meta can match on that only exists on the request object.
export const buildRequestContext = (req) => ({
  clientIpAddress: extractClientIp(req),
  clientUserAgent: req?.headers?.['user-agent'],
  // _fbp is written by the Pixel base code on the first visit; _fbc when the
  // user lands with an fbclid in the URL. Both are absent when the Pixel never
  // loaded (ad blocker), which is fine — the rest of the matching still works.
  fbp: req?.cookies?._fbp,
  fbc: req?.cookies?._fbc,
  // The page the user converted on, not the API route.
  eventSourceUrl: req?.headers?.referer,
});

export const sendServerEvent = async ({
  eventName,
  eventId,
  eventTime,
  user = {},
  request = {},
  customData,
}) => {
  const config = getConversionsApiConfig();
  // No credentials configured (local dev, previews): skip quietly.
  if (!config) return { skipped: true };

  const payload = {
    data: [withoutEmptyValues({
      event_name: eventName,
      // Identical to the eventID the browser Pixel sends for this conversion.
      event_id: eventId,
      // Unix seconds of the actual conversion, not of this HTTP call.
      event_time: eventTime,
      action_source: 'website',
      event_source_url: request.eventSourceUrl,
      user_data: withoutEmptyValues({
        em: hashed(user.email, normalizeEmail),
        ph: hashed(user.phoneNumber, normalizePhone),
        fn: hashed(user.firstName, normalizeName),
        ln: hashed(user.lastName, normalizeName),
        external_id: hashed(user.externalId, normalizeExternalId),
        client_ip_address: request.clientIpAddress,
        client_user_agent: request.clientUserAgent,
        fbp: request.fbp,
        fbc: request.fbc,
      }),
      custom_data: customData,
    })],
    // Sent in the body rather than the query string so the token never lands
    // in access logs or proxy traces.
    access_token: config.accessToken,
    ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('[meta-capi] Meta rechazó el evento', eventName, response.status, body?.error);
      return { ok: false };
    }

    return { ok: true, eventsReceived: body?.events_received };
  } catch (error) {
    console.error('[meta-capi] No se pudo enviar el evento', eventName, error?.message || error);
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
};

// Business wrapper for the one conversion we track today: the B2C free trial.
// `user` is the freshly created user row; `req` the signup request.
export const sendTrialStartedEvent = async ({ req, user, eventId }) => (
  sendServerEvent({
    eventName: META_EVENTS.START_TRIAL,
    eventId,
    eventTime: Math.floor(Date.now() / 1000),
    user: {
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      externalId: user.id,
    },
    request: buildRequestContext(req),
    customData: TRIAL_CUSTOM_DATA,
  })
);
