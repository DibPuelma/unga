import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { createActivity } from 'db/activity';
import { getCores } from 'db/core';
import { createOpenAIApiCall } from 'db/openAIApiCall';
import CreditsService, { InsufficientCreditsError } from 'services/CreditsService';
import { generateExperience, experienceToActivityPayload } from 'services/openai/experiences';
import { TRAMOS } from 'services/openai/curriculum/bcep-cl';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.id) return res.status(401).end();
  if (!user.institution?.id) return res.status(403).json({ error: 'missing_institution' });

  const { tramo, theme, nucleoIds, materials, durationMinutes, extraContext, levelIds } = req.body || {};

  if (!TRAMOS.includes(tramo)) return res.status(400).json({ error: 'invalid_tramo' });
  if (!theme || typeof theme !== 'string' || !theme.trim()) {
    return res.status(400).json({ error: 'missing_theme' });
  }

  if (await CreditsService.isRateLimited(user.id)) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  const generationId = randomUUID();

  try {
    await CreditsService.consumeForUser(user, generationId);
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      const credits = await CreditsService.getCreditsForUser(user.id);
      return res.status(402).json({
        code: 'NO_CREDITS',
        plan: credits?.plan || user.plan,
      });
    }
    throw e;
  }

  try {
    const { experience, prompt, model, usage } = await generateExperience({
      tramo,
      theme: theme.trim().slice(0, 300),
      nucleoIds,
      materials,
      durationMinutes,
      extraContext: extraContext?.slice(0, 500),
    });

    const institutionCores = await getCores(user.institution.id);
    const activity = await createActivity(
      experienceToActivityPayload({
        experience,
        userId: user.id,
        institutionId: user.institution.id,
        levelIds,
        institutionCores,
        generationId,
      })
    );

    // Non-fatal: a logging failure must not refund a successful generation.
    await createOpenAIApiCall({
      userId: user.id,
      prompt,
      response: JSON.stringify(experience),
      model,
      tokensUsed: usage?.total_tokens,
      relatedCollection: 'ExperienceGeneration',
    }).catch((e) => console.error('OpenAIApiCalls logging failed:', e));

    const credits = await CreditsService.getCreditsForUser(user.id);

    return res.status(200).json({
      activity,
      experience,
      remainingCredits: credits ? credits.remaining : null,
    });
  } catch (e) {
    console.error('generate-experience failed:', e);
    await CreditsService.refundForUser(user, generationId);
    return res.status(502).json({ error: 'generation_failed' });
  }
}
