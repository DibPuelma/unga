// Meta Pixel / Conversions API configuration.
//
// The Pixel ID is public by definition (it ships inside the browser snippet),
// so it lives under NEXT_PUBLIC_. The CAPI access token is server-only and
// follows the house convention of unprefixed secrets (see SLACK_BOT_TOKEN,
// TRANSBANK_API_KEY). Nothing here is hardcoded: staging and production can
// point at different Pixels without a code change.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

// Only set while validating in Events Manager > Test Events. Leave it unset in
// production: events carrying a test_event_code are not attributed to ads.
const META_CAPI_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';

// Returns null when credentials are missing (local dev, preview deploys) so
// callers can no-op instead of throwing. Mirrors getTransbankConfig(), except
// tracking is optional and must never block a request.
export const getConversionsApiConfig = () => {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) return null;

  return {
    endpoint: `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_PIXEL_ID}/events`,
    accessToken: META_CAPI_ACCESS_TOKEN,
    testEventCode: META_CAPI_TEST_EVENT_CODE || undefined,
  };
};
