// Shared plan constants, usable from both server (services) and client (hooks/components).
// 'free' = B2C sin suscripción (incluye los 5 créditos de regalo del registro).
// 'unga' = suscriptor B2C activo ($4.990/mes, 100 créditos mensuales).
// 'institutional' = B2B, invitado por un centro educativo (sin créditos, acceso completo).
export const ALL_PLANS = ['free', 'unga', 'institutional', 'parentsBase'];
export const B2C_PLANS = ['free', 'unga'];
export const INSTITUTIONAL_ONLY = ['institutional'];
export const PLANS_WITH_PLANNING = ['free', 'unga', 'institutional'];

export const isB2CPlan = (plan) => B2C_PLANS.includes(plan);

export const SUBSCRIPTION_PRICE_CLP = 4990;
export const MONTHLY_CREDITS = 100;
export const SIGNUP_CREDITS = 5;
export const CREDIT_PACK_SIZE = 10;
export const CREDIT_PACK_PRICE_CLP = 2000;

// Estimación para el dashboard de métricas: OpenAIApiCalls solo guarda tokens
// totales (sin separar prompt/completion), así que este es un blend aproximado
// del pricing público de gpt-5-mini. Ajustar ambas constantes si cambia el
// pricing real o el tipo de cambio.
export const GPT5_MINI_BLENDED_USD_PER_1K_TOKENS = 1.1;
export const USD_TO_CLP_RATE = 950;
