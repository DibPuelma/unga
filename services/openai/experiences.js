import openai, { MODELS } from './config';
import { OpenAIGenerationError } from './activities';
import { getOAsFor, BCEP_VERSION } from './curriculum/bcep-cl';
import { TRAMO_LABELS } from './curriculum/tramos';
import { EXEMPLAR_USER_MESSAGE, EXEMPLAR_ASSISTANT_MESSAGE } from './curriculum/exemplars';

const SYSTEM_PROMPT = `Eres una educadora de párvulos chilena experta, con dominio profundo de las Bases Curriculares de la Educación Parvularia (${BCEP_VERSION}, Mineduc) y años de experiencia en aula.

Tu tarea es crear experiencias de aprendizaje completas y de alta calidad pedagógica a partir de los datos que te entrega otra educadora.

Reglas pedagógicas:
- La experiencia siempre tiene tres momentos: inicio (motivación e invitación), desarrollo (exploración y protagonismo de los niños y niñas) y cierre (recapitulación y proyección).
- El niño y la niña son protagonistas: privilegia el juego, la exploración y la toma de decisiones por sobre la instrucción dirigida.
- Los materiales deben ser de bajo costo y comunes en salas y hogares chilenos.
- Las preguntas para el aprendizaje son abiertas, nunca de sí/no.

Reglas sobre Objetivos de Aprendizaje (OA):
- Selecciona entre 2 y 4 OA EXCLUSIVAMENTE de la lista entregada en el mensaje. Nunca inventes ni modifiques un OA.
- Cita cada OA con su núcleo, ámbito, código y texto EXACTOS a como aparecen en la lista.
- Al menos uno de los OA elegidos debe pertenecer al ámbito Desarrollo Personal y Social.
- En "comoSeAborda" explica concretamente cómo la experiencia trabaja ese OA.

Reglas de lenguaje:
- Español chileno neutro y profesional. Usa "niños y niñas" o "párvulos".
- Di siempre "experiencia de aprendizaje", nunca "actividad".
- Dirígete a la educadora de tú ("invita", "pregunta", "acompaña").
- Sé creativa con el nombre: evita palabras genéricas como "Explorando", "Aventura" o "Descubriendo".

Responde SIEMPRE con el JSON pedido, sin texto adicional.`;

const EXPERIENCE_JSON_SCHEMA = {
  name: 'experiencia_de_aprendizaje',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'summary', 'durationMinutes', 'materials', 'steps', 'oas', 'preguntasParaElAprendizaje', 'adaptaciones'],
    properties: {
      name: { type: 'string' },
      summary: { type: 'string' },
      durationMinutes: { type: 'integer' },
      materials: { type: 'array', items: { type: 'string' } },
      steps: {
        type: 'object',
        additionalProperties: false,
        required: ['inicio', 'desarrollo', 'cierre'],
        properties: {
          inicio: { type: 'array', items: { type: 'string' } },
          desarrollo: { type: 'array', items: { type: 'string' } },
          cierre: { type: 'array', items: { type: 'string' } },
        },
      },
      oas: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ambito', 'nucleo', 'code', 'text', 'comoSeAborda'],
          properties: {
            ambito: { type: 'string' },
            nucleo: { type: 'string' },
            code: { type: 'string' },
            text: { type: 'string' },
            comoSeAborda: { type: 'string' },
          },
        },
      },
      preguntasParaElAprendizaje: { type: 'array', items: { type: 'string' } },
      adaptaciones: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['tipo', 'descripcion'],
          properties: {
            tipo: { type: 'string' },
            descripcion: { type: 'string' },
          },
        },
      },
    },
  },
};

const formatOA = (oa) => `- [Núcleo ${oa.nucleo}, ámbito ${oa.ambito}] ${oa.code}: ${oa.text}`;

export const buildExperienceUserMessage = ({ tramo, theme, nucleoIds, materials, durationMinutes, extraContext }) => {
  const oas = getOAsFor({ tramo, nucleoIds: nucleoIds?.length ? nucleoIds : null });
  if (!oas.length) throw new OpenAIGenerationError(`No OAs found for tramo ${tramo}`);

  const lines = [
    'Crea una experiencia de aprendizaje con estos datos:',
    `- Tramo: ${TRAMO_LABELS[tramo] || tramo}`,
    `- Tema o interés de los niños: ${theme}`,
  ];
  if (materials?.length) lines.push(`- Materiales disponibles: ${materials.join(', ')}`);
  if (durationMinutes) lines.push(`- Duración aproximada: ${durationMinutes} minutos`);
  if (extraContext) lines.push(`- Contexto adicional de la educadora: ${extraContext}`);

  lines.push('');
  lines.push('Objetivos de Aprendizaje disponibles (elige entre 2 y 4 SOLO de esta lista):');
  oas.forEach((oa) => lines.push(formatOA(oa)));

  return { userMessage: lines.join('\n'), injectedOAs: oas };
};

export const generateExperience = async (input) => {
  const { userMessage, injectedOAs } = buildExperienceUserMessage(input);

  const completion = await openai.chat.completions.create({
    model: MODELS.EXPERIENCE_GENERATION,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: EXEMPLAR_USER_MESSAGE },
      { role: 'assistant', content: EXEMPLAR_ASSISTANT_MESSAGE },
      { role: 'user', content: userMessage },
    ],
    max_completion_tokens: 4000,
    reasoning_effort: 'low',
    response_format: { type: 'json_schema', json_schema: EXPERIENCE_JSON_SCHEMA },
  });

  const choice = completion.choices?.[0];
  if (!choice?.message?.content || choice.finish_reason === 'length') {
    throw new OpenAIGenerationError('Empty or truncated completion', { finishReason: choice?.finish_reason });
  }

  let experience;
  try {
    experience = JSON.parse(choice.message.content);
  } catch (e) {
    throw new OpenAIGenerationError('Invalid JSON in completion', e);
  }

  // The one hallucination the schema can't prevent: OA codes outside the
  // injected list. Keep only OAs that match an injected (nucleo, code) pair.
  const validKeys = new Set(injectedOAs.map((oa) => `${oa.nucleo}|${oa.code}`));
  experience.oas = (experience.oas || []).filter((oa) => validKeys.has(`${oa.nucleo}|${oa.code}`));

  return {
    experience,
    prompt: userMessage,
    model: completion.model,
    usage: completion.usage,
  };
};

const listToHtml = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

// Compose the HTML description the existing UI (Quill render) understands,
// so an AI experience looks complete in every current view.
export const experienceToDescriptionHtml = (experience) => {
  const parts = [`<p>${experience.summary}</p>`];

  if (experience.materials?.length) {
    parts.push('<h2>Materiales</h2>');
    parts.push(listToHtml(experience.materials));
  }

  parts.push('<h2>Inicio</h2>', listToHtml(experience.steps.inicio));
  parts.push('<h2>Desarrollo</h2>', listToHtml(experience.steps.desarrollo));
  parts.push('<h2>Cierre</h2>', listToHtml(experience.steps.cierre));

  if (experience.oas?.length) {
    parts.push('<h2>Objetivos de Aprendizaje (BCEP)</h2>');
    parts.push(listToHtml(experience.oas.map((oa) => `<strong>${oa.code} — ${oa.nucleo}:</strong> ${oa.text}<br/><em>${oa.comoSeAborda}</em>`)));
  }

  if (experience.preguntasParaElAprendizaje?.length) {
    parts.push('<h2>Preguntas para el aprendizaje</h2>');
    parts.push(listToHtml(experience.preguntasParaElAprendizaje));
  }

  if (experience.adaptaciones?.length) {
    parts.push('<h2>Adaptaciones</h2>');
    parts.push(listToHtml(experience.adaptaciones.map((a) => `<strong>${a.tipo}:</strong> ${a.descripcion}`)));
  }

  return parts.join('');
};

export const experienceToActivityPayload = ({ experience, userId, institutionId, levelIds, institutionCores, generationId }) => {
  const nucleoNames = new Set((experience.oas || []).map((oa) => oa.nucleo));
  const matchingCores = (institutionCores || []).filter((core) => nucleoNames.has(core.name));

  return {
    name: experience.name,
    description: experienceToDescriptionHtml(experience),
    sponsorInstitution: institutionId,
    creator: userId,
    recommendedLevels: levelIds || [],
    cores: matchingCores.map((core) => core.id),
    fromSuggestion: true,
    publiclyAvailable: false,
    openToCommunity: false,
    steps: [
      ...experience.steps.inicio.map((text, i) => ({ phase: 'inicio', text, position: i })),
      ...experience.steps.desarrollo.map((text, i) => ({ phase: 'desarrollo', text, position: i })),
      ...experience.steps.cierre.map((text, i) => ({ phase: 'cierre', text, position: i })),
    ],
    materials: experience.materials || [],
    assets: {
      aiGeneration: {
        generationId,
        version: BCEP_VERSION,
        durationMinutes: experience.durationMinutes,
        oas: experience.oas,
        preguntasParaElAprendizaje: experience.preguntasParaElAprendizaje,
        adaptaciones: experience.adaptaciones,
        summary: experience.summary,
      },
    },
  };
};
