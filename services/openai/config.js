import OpenAI from 'openai';

export const MODELS = {
  EXPERIENCE_GENERATION: 'gpt-5-mini',
};

const openai = new OpenAI({
  organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60_000,
  maxRetries: 2,
});

export default openai;
