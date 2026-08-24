// Shared Meta Pixel vocabulary, usable from both the browser (components,
// pages) and the server (services/meta/conversionsApi.js), so the two sides of
// the same conversion always describe it identically.
import { SIGNUP_CREDITS } from './plans';

// Meta standard event for the B2C conversion.
//
// The signup gives away SIGNUP_CREDITS experiences with no card — a real free
// trial of the paid product ('unga', $4.990/mes), not just an account. That is
// exactly what Meta's StartTrial describes and what the ad sets optimize for.
// CompleteRegistration would describe the account creation instead, and would
// also fire for parent signups that never enter the trial.
export const META_EVENTS = {
  START_TRIAL: 'StartTrial',
};

// custom_data sent from both the Pixel and the Conversions API. Meta only
// requires event_name + event_id to match for deduplication, but keeping the
// payload identical makes the two rows in Test Events obviously the same event.
export const TRIAL_CUSTOM_DATA = {
  content_name: `Prueba gratis - ${SIGNUP_CREDITS} experiencias con IA`,
  content_category: 'b2c_trial',
};

// Fires a browser Pixel event. `eventId` must be the id the server generated
// for this same conversion (see services/meta/eventId.js) — without it Meta
// counts the Pixel hit and the CAPI hit as two separate conversions.
export const trackMetaEvent = (eventName, { eventId, customData } = {}) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

  try {
    window.fbq('track', eventName, customData || {}, eventId ? { eventID: eventId } : {});
  } catch (error) {
    // Analytics must never break a user flow.
    console.error('[meta-pixel] No se pudo enviar el evento', eventName, error);
  }
};
