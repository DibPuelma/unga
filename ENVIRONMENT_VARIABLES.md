# Environment Variables Required

This document lists all environment variables found in the codebase (excluding `.env.example`), with details about where they are used and what they're used for.

## Database

- **`DATABASE_URL`**
  - **Used for**: PostgreSQL database connection string
  - **Where**: Required by Prisma (`prisma/schema.prisma` line 7)
  - **Required**: Yes

## Authentication & Security

- **`NEXTAUTH_SECRET`**
  - **Used for**: Secret key for NextAuth.js session encryption and JWT signing
  - **Where**: Automatically read by NextAuth.js v4 (not explicitly referenced in code, but required by NextAuth.js)
  - **Required**: Yes (required in production, optional in development)
  - **Note**: NextAuth.js automatically reads this environment variable. Used to encrypt JWTs and hash email verification tokens.

- **`NEXTAUTH_URL`**
  - **Used for**: Base URL of the application for NextAuth.js callbacks
  - **Where**: Automatically read by NextAuth.js v4 (not explicitly referenced in code, but required by NextAuth.js)
  - **Required**: Yes (required in production, optional in development)
  - **Note**: NextAuth.js automatically reads this environment variable. Set to canonical URL (e.g., `https://yourdomain.com`). On Vercel, this is auto-detected.

- **`UNGA_INTERNAL_ENCRIPTION_KEY`**
  - **Used for**: Internal encryption key for crypto operations (AES-256-CTR encryption)
  - **Where**: `services/crypto.js` (lines 3, 8, 19)
  - **Required**: Yes
  - **Functions**: Used in `encrypt()` and `decrypt()` functions for internal data encryption

- **`UNGA_INTERNAL_API_KEY`**
  - **Used for**: API key authentication for internal API endpoints
  - **Where**: `pages/api/ai/generate-activities.js` (line 12)
  - **Required**: Yes
  - **Usage**: Validates `x-api-key` header for internal API access

- **`CRON_SECRET`**
  - **Used for**: Secret token for cron job authentication
  - **Where**: `pages/api/ai/generate-activities.js` (line 12)
  - **Required**: Yes
  - **Usage**: Validates `Authorization: Bearer <token>` header for cron job access

## Email (Resend)

- **`RESEND_API_KEY`**
  - **Used for**: Resend API key for all transactional emails
  - **Where**: `services/email/resend.js`
  - **Required**: Yes
  - **Usage**: Initializes Resend client used by authentication, onboarding, and reminder emails

## Cloud Storage (Google Cloud Platform)

**Note**: GCP Storage functions (`generateV4ReadSignedUrl`, `uploadFromMemory`) are exported from `services/GCPStorage.js` but do not appear to be used anywhere in the codebase. These variables may be for future use or legacy code.

- **`GCP_PROJECT_ID`**
  - **Used for**: Google Cloud Platform project ID
  - **Where**: `services/GCPStorage.js` (line 3)
  - **Required**: Conditional (only if GCP Storage is used)
  - **Usage**: Initializes GCP Storage client

- **`GCP_DEV_CLIENT_EMAIL`**
  - **Used for**: GCP service account email for development environment
  - **Where**: `services/GCPStorage.js` (line 4)
  - **Required**: Conditional (only if GCP Storage is used in development)
  - **Usage**: GCP Storage authentication credentials (used when `NODE_ENV !== 'production'`)

- **`GCP_DEV_PRIVATE_KEY`**
  - **Used for**: GCP service account private key for development environment
  - **Where**: `services/GCPStorage.js` (line 5)
  - **Required**: Conditional (only if GCP Storage is used in development)
  - **Usage**: GCP Storage authentication credentials (used when `NODE_ENV !== 'production'`)

- **`GCP_DEV_BUCKET_NAME`**
  - **Used for**: GCP bucket name for development environment
  - **Where**: `services/GCPStorage.js` (line 6)
  - **Required**: Conditional (only if GCP Storage is used in development)
  - **Usage**: GCP Storage bucket name (used when `NODE_ENV !== 'production'`)

- **`GCP_PROD_CLIENT_EMAIL`**
  - **Used for**: GCP service account email for production environment
  - **Where**: `services/GCPStorage.js` (line 9)
  - **Required**: Conditional (only if GCP Storage is used in production)
  - **Usage**: GCP Storage authentication credentials (used when `NODE_ENV === 'production'`)

- **`GCP_PROD_PRIVATE_KEY`**
  - **Used for**: GCP service account private key for production environment
  - **Where**: `services/GCPStorage.js` (line 10)
  - **Required**: Conditional (only if GCP Storage is used in production)
  - **Usage**: GCP Storage authentication credentials (used when `NODE_ENV === 'production'`)

- **`GCP_PROD_BUCKET_NAME`**
  - **Used for**: GCP bucket name for production environment
  - **Where**: `services/GCPStorage.js` (line 11)
  - **Required**: Conditional (only if GCP Storage is used in production)
  - **Usage**: GCP Storage bucket name (used when `NODE_ENV === 'production'`)

## Cloudinary (Image/Media Storage)

- **`CLOUDINARY_API_KEY`**
  - **Used for**: Cloudinary API key for server-side image/media uploads
  - **Where**: `services/CloudinaryService.js` (line 5)
  - **Required**: Yes
  - **Usage**: Configures Cloudinary SDK. Used by `CloudinaryService.upload()` called from `pages/api/institutions/[institutionId]/classrooms/[classroomId]/students/[studentId]/reports/index.js` for uploading PDF reports

- **`CLOUDINARY_API_SECRET`**
  - **Used for**: Cloudinary API secret for server-side image/media uploads
  - **Where**: `services/CloudinaryService.js` (line 6)
  - **Required**: Yes
  - **Usage**: Configures Cloudinary SDK for server-side operations

- **`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`**
  - **Used for**: Cloudinary cloud name (exposed to browser)
  - **Where**: `src/components/utils/CloudinaryUploadWidget.js` (line 26)
  - **Required**: Yes
  - **Usage**: Configures Cloudinary upload widget in browser. Used in multiple components:
    - `pages/classes/[classroomId]/observations/[observationId]/edit.js`
    - `pages/institutions/[institutionId]/activities/[activityId]/edit.js`
    - `src/components/activity/PlannedActivityObservations.js`
    - `src/components/institution/configuration/tabs/General.js`
    - `src/components/students/Avatar.js`
    - `pages/users/[userId]/profile.js`

- **`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`**
  - **Used for**: Cloudinary upload preset (exposed to browser)
  - **Where**: `src/components/utils/CloudinaryUploadWidget.js` (line 27)
  - **Required**: Yes
  - **Usage**: Configures Cloudinary upload widget preset in browser (same components as above)

## OpenAI

- **`OPENAI_ORGANIZATION_ID`**
  - **Used for**: OpenAI organization ID
  - **Where**: `services/openai/config.js` (line 3)
  - **Required**: Yes
  - **Usage**: Configures OpenAI API client. Used by all OpenAI functions:
    - `services/openai/activities.js` - `generatePromptForActivity()`, `generatePromptBasedOnActivitiesIds()`, `transformDescriptionForParents()`, `suggestActivities()`, `generateNewActivityFromOthers()`
    - Called from API routes: `pages/api/ai/generate-activities.js`, `pages/api/activities/suggest-based-on-others.js`, `pages/api/institutions/[institutionId]/activities/suggest.js`

- **`OPENAI_API_KEY`**
  - **Used for**: OpenAI API key
  - **Where**: `services/openai/config.js` (line 4)
  - **Required**: Yes
  - **Usage**: Configures OpenAI API client (same usage as `OPENAI_ORGANIZATION_ID`)

## External Services

### Slack

- **`SLACK_BOT_TOKEN`**
  - **Used for**: Slack bot token for sending notifications to Slack channels
  - **Where**: `services/slack.js` (line 3)
  - **Required**: Yes
  - **Usage**: Initializes Slack WebClient. Used by `sendMessageToChannel()` function called from:
    - `commands/slack/sendNewUserSlackMessage.js` - Notifies when new users register (called from `db/user.js`)
    - `commands/slack/sendAddRoleToUserSlackMessage.js` - Notifies when roles are added to users (called from `db/user.js`)
    - `commands/slack/SendNewPMFAnswerSlackMessage.js` - Notifies when PMF answers are submitted (called from `db/pmfAnswer.js`)
    - `commands/slack/SendAddedPaymentMethodSlackMessage.js` - Notifies when payment methods are added (called from `pages/payments/individual-plan-suscription-success.js`)
    - `commands/slack/SendUserSawTrialEndedSlackMessage.js` - Notifies when users see trial ended

### WhatsApp

- **`WA_PHONE_NUMBER_ID`**
  - **Used for**: WhatsApp phone number ID for WhatsApp Business API
  - **Where**: `services/WhatsappService.js` (line 8)
  - **Required**: Conditional (only if WhatsApp functionality is used)
  - **Usage**: Initializes WhatsApp client in `WhatsappService` constructor. The service is exported but usage in the codebase was not found.

### Browserless (Puppeteer)

- **`BROWSERLESS_TOKEN`**
  - **Used for**: Browserless.io token for headless browser operations in production
  - **Where**: `services/PuppeteerService.js` (line 8)
  - **Required**: Conditional (only required in production)
  - **Usage**: Connects to Browserless.io service for PDF generation. Used when `NODE_ENV === 'production'`. In development, Puppeteer runs locally.
  - **Used by**:
    - `pages/api/print/html.js` - Generates PDFs from HTML
    - `pages/api/institutions/[institutionId]/classrooms/[classroomId]/students/[studentId]/reports/index.js` - Generates student report PDFs

### Mergent

- **`MERGENT_API_KEY`**
  - **Used for**: Mergent API key for webhook signature validation
  - **Where**: `services/mergent/requestValidator.js` (line 5)
  - **Required**: Yes
  - **Usage**: Validates HMAC-SHA1 signatures for Mergent webhooks. Used by `validateSignature()` function called from:
    - `pages/api/reports/teachers-weekly-stats.js` - Validates webhook signature for teacher weekly stats reports

## Analytics & Monitoring (Optional)

### Mixpanel (Currently Commented Out - NOT USED)

- **`NEXT_PUBLIC_MIXPANEL_DEV_TOKEN`**
  - **Used for**: Mixpanel development token
  - **Where**: `pages/_app.js` (line 32) - **COMMENTED OUT**
  - **Required**: No (code is commented out)
  - **Status**: ⚠️ **NOT CURRENTLY USED** - The Mixpanel initialization code is commented out

- **`NEXT_PUBLIC_MIXPANEL_PROD_TOKEN`**
  - **Used for**: Mixpanel production token
  - **Where**: `pages/_app.js` (line 33) - **COMMENTED OUT**
  - **Required**: No (code is commented out)
  - **Status**: ⚠️ **NOT CURRENTLY USED** - The Mixpanel initialization code is commented out

### Meta Pixel & Conversions API (Optional)

Tracks the B2C `StartTrial` conversion from both the browser and the server. See
`META_PIXEL_CAPI.md` for the full setup and verification guide.

- **`NEXT_PUBLIC_META_PIXEL_ID`**
  - **Used for**: Meta Pixel ID, shared by the browser Pixel and the Conversions API endpoint
  - **Where**: `src/components/analytics/MetaPixel.js` and `services/meta/config.js`
  - **Required**: No (both the Pixel and CAPI no-op when unset)
  - **Value**: `1446549157333102` (not a secret — it ships in the browser snippet)

- **`META_CAPI_ACCESS_TOKEN`**
  - **Used for**: Conversions API access token (server-only secret)
  - **Where**: `services/meta/config.js`
  - **Required**: No (CAPI is skipped when unset; the browser Pixel still fires)
  - **Usage**: Generated in Events Manager > Settings > Conversions API > Generate access token

- **`META_CAPI_TEST_EVENT_CODE`**
  - **Used for**: Routes server events into Events Manager > Test Events
  - **Where**: `services/meta/config.js`
  - **Required**: No
  - **Note**: ⚠️ Must be **unset in production** — events carrying a test code are not attributed to ads

- **`META_GRAPH_API_VERSION`**
  - **Used for**: Graph API version used for `POST /{pixel_id}/events`
  - **Where**: `services/meta/config.js`
  - **Required**: No (defaults to `v21.0`)

### Hotjar (Optional)

- **`NEXT_PUBLIC_HOTJAR_HJID`**
  - **Used for**: Hotjar site ID for user behavior analytics
  - **Where**: `pages/_app.js` (line 49)
  - **Required**: No (optional - only initializes if both HJID and HJSV are set)
  - **Usage**: Initializes Hotjar analytics in browser if both variables are present

- **`NEXT_PUBLIC_HOTJAR_HJSV`**
  - **Used for**: Hotjar script version
  - **Where**: `pages/_app.js` (line 50)
  - **Required**: No (optional - only initializes if both HJID and HJSV are set)
  - **Usage**: Initializes Hotjar analytics in browser if both variables are present

## Application Configuration

- **`NODE_ENV`**
  - **Used for**: Node environment (`development`, `production`, `test`)
  - **Where**: Multiple files throughout the codebase
  - **Required**: No (automatically set by Next.js)
  - **Usage**: 
    - Controls GCP Storage credentials (dev vs prod)
    - Controls Puppeteer behavior (local vs Browserless.io)
    - Controls Prisma logging level (`lib/prisma.js`)
    - Controls Slack notification channels
    - Controls Sentry disable flag (`next.config.js`)

- **`UNGA_EXPERIENCES_INSTITUTION_ID`**
  - **Used for**: Institution ID for Unga Experiences feature (AI-generated activities)
  - **Where**: `pages/api/ai/generate-activities.js` (lines 16, 20, 33, 46)
  - **Required**: Yes
  - **Usage**: Identifies the institution that sponsors AI-generated activities. Used to fetch cores, filter activities, and set activity sponsor.

- **`UNGA_EXPERIENCES_USER_ID`**
  - **Used for**: User ID for Unga Experiences feature (AI-generated activities)
  - **Where**: `pages/api/ai/generate-activities.js` (lines 17, 47, 76)
  - **Required**: Yes
  - **Usage**: Identifies the user who creates AI-generated activities. Used as creator ID and for tracking OpenAI API calls.

## Summary

### Required Variables (Core Functionality)
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `UNGA_INTERNAL_ENCRIPTION_KEY`
- `UNGA_INTERNAL_API_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `OPENAI_ORGANIZATION_ID`, `OPENAI_API_KEY`
- `SLACK_BOT_TOKEN`
- `MERGENT_API_KEY`
- `UNGA_EXPERIENCES_INSTITUTION_ID`, `UNGA_EXPERIENCES_USER_ID`

### Conditional Variables (Only if specific features are used)
- `BROWSERLESS_TOKEN` (production only)
- `GCP_*` variables (if GCP Storage is used)
- `WA_PHONE_NUMBER_ID` (if WhatsApp is used)

### Optional Variables
- `NEXT_PUBLIC_HOTJAR_HJID`, `NEXT_PUBLIC_HOTJAR_HJSV` (analytics)

### Not Currently Used
- `NEXT_PUBLIC_MIXPANEL_DEV_TOKEN`, `NEXT_PUBLIC_MIXPANEL_PROD_TOKEN` (commented out)

## Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and should not contain sensitive data
- `NODE_ENV` is automatically set by Next.js based on the build/run command
- GCP credentials switch between dev and prod based on `NODE_ENV === 'production'`
- Sentry DSN is currently hardcoded in the Sentry config files (not using environment variables)
- NextAuth.js automatically reads `NEXTAUTH_SECRET` and `NEXTAUTH_URL` even though they're not explicitly referenced in the code

## Transbank (Oneclick Mall)

Pagos de la suscripción B2C ($4.990/mes, cobrada el 1° de cada mes) y packs de créditos extra. La recurrencia es propia (crons `/api/payments/charge-renewals` y `/api/payments/retry-failed`); Transbank solo autoriza cada cobro contra la tarjeta inscrita.

| Variable | Descripción |
|---|---|
| `TRANSBANK_ENVIRONMENT` | `integration` (default) o `production`. |
| `TRANSBANK_ONECLICK_MALL_COMMERCE_CODE` | Código de comercio Mall Oneclick. En integración se usa por defecto `597055555541`. |
| `TRANSBANK_ONECLICK_TIENDA_COMMERCE_CODE` | Código de comercio Tienda (child). En integración se usa por defecto `597055555542`. |
| `TRANSBANK_API_KEY` | API key Oneclick. En integración se usa la pública de Transbank. |

Tarjeta de prueba (solo integración): VISA `4051885600446623`, CVV `123`, cualquier fecha futura; RUT `11.111.111-1`, clave `1234`.
