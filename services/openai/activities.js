import { getActivitiesByIds } from 'db/activity';
import openai, { MODELS } from './config';
import _ from 'lodash';

export class OpenAIGenerationError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'OpenAIGenerationError';
    this.cause = cause;
  }
}

export const generatePromptForActivity = ({ ageMin, ageMax, cores, curricularObjectives, objectives, subObjectives }) => {
  return `
Tengo una sala con niños de ${ageMin} a ${ageMax} años.
Quiero que aprendan sobre ${cores}
Específicamente quiero que aprendan sobre ${curricularObjectives}
Los voy a evaluar en ${objectives}, ${subObjectives}

Necesito que me sugieras una experiencia de aprendizaje para realizar con ellos que tenga un inicio, un desarrollo y un cierre.
Además dame 5 preguntas que les debería hacer para reforzar el conocimiento
  `
}

export const generatePromptBasedOnActivitiesIds = async (activitiesIds) => {
  const activities = await getActivitiesByIds(activitiesIds);
  const allLevels = activities.map((activity) => activity.recommendedLevels).flat();
  const allCoresNames = _.uniq(activities.map((activity) => activity.cores).flat().map((core) => core.name));
  const allCurricularObjectives = _.uniqBy(activities.map((activity) => activity.curricularObjectives).flat(), 'name')
  const specificCurricularObjectives = allCurricularObjectives.filter((curricularObjective) => curricularObjective.type === 'specific').map((curricularObjective) => curricularObjective.name);
  const transversalCurricularObjectives = allCurricularObjectives.filter((curricularObjective) => curricularObjective.type === 'transversal').map((curricularObjective) => curricularObjective.name);

  const ages = allLevels.reduce((acc, level) => {
    acc.push(level.ageUpTo);
    acc.push(level.ageFrom);
    return acc;
  }, [])
  const maxAge = Math.max(...ages);
  const minAge = Math.min(...ages);
  let prompt = `
  Las siguientes ${activities.length} experiencias de aprendizaje son para niños y niñas entre ${minAge} y ${maxAge} años.
  Estas experiencias potencian ${allCoresNames.join(', ')}.
  Además, buscan que los niños y niñas cumplan los siguientes objetivos específicos: ${specificCurricularObjectives.join(', ')}.
  Por último, buscan que los niños y niñas cumplan los siguientes objetivos transversales: ${transversalCurricularObjectives.join(', ')}.
  En base a ellas, crea una experiencia de aprendizaje completamente nueva.
  `
  activities.forEach((activity, i) => {
    prompt += `
Experiencia ${i + 1}
${activity.name}
${activity.description}
`;
  });

  return prompt;
}

// gpt-5 family: no temperature/top_p/penalties, use max_completion_tokens
// (reasoning tokens draw from the same budget) and reasoning_effort.
const chatCompletion = async ({ messages, responseFormat, maxCompletionTokens = 4000 }) => {
  const completion = await openai.chat.completions.create({
    model: MODELS.EXPERIENCE_GENERATION,
    messages,
    max_completion_tokens: maxCompletionTokens,
    reasoning_effort: 'low',
    ...(responseFormat ? { response_format: responseFormat } : {}),
  });

  const choice = completion.choices?.[0];
  if (!choice?.message?.content || choice.finish_reason === 'length') {
    throw new OpenAIGenerationError('Empty or truncated completion', { finishReason: choice?.finish_reason });
  }

  return {
    content: choice.message.content,
    model: completion.model,
    usage: completion.usage,
  };
}

export const transformDescriptionForParents = async (description) => {
  const prompt = `
  Esta es una experiencia de aprendizaje para que una educadora de párvulos la realice en su sala, con muchos niños y niñas. Transfórmala para que un padre o una madre la pueda hacer con su hijo o hija en casa. Expresa todo en una serie de pasos a seguir. Mantén el formato HTML.

  ${description}
  `;

  return chatCompletion({ messages: [{ role: 'user', content: prompt }] });
}

export const suggestActivities = async (prompt) => {
  return chatCompletion({ messages: [{ role: 'user', content: prompt }] });
}

export const generateNewActivityFromOthers = async (prompt) => {
  const systemPrompt = `
  Eres una educadora de párvulos de Chile, eres experta en planificar experiencias de aprendizaje para niños y niñas entre 0 y 6 años utilizando los métodos recomendados por el ministerio de educación de Chile.
  Tu objetivo es, a partir de algunas experiencias de aprendizaje que te entregan, crear una completamente nueva.
  Esta experiencia nueva debe contener:
  Un nombre.
  Una descripción con los materiales necesarios.
  Uno o más objetivos específicos. Los que selecciones deben estar escritos de manera exactamente igual a los objetivos específicos de las experiencias entregadas.
  Uno o más objetivos transversales. Los que selecciones deben estar escritos de manera exactamente igual a los objetivos transversales de las experiencias entregadas.
  La respuesta siempre debe estar en formato JSON con las siguientes llaves:
  "name" para el nombre de la experiencia.
  "description" para la descripción de la experiencia y los materiales.
  "specificCurricularObjectives" para los objetivos específicos. Este campo es un array.
  "transversalCurricularObjectives" para los objetivos transversales. Este campo es un array.
  Usa saltos de línea y tags html para determinar títulos en la descripción, para que sea fácil de leer por un humano.
  Solamente escribe el nombre, la descripción y los materiales de la experiencia.
  Para el nombre, sé muy creativa, no uses palabras básicas como "Jardín", "Explorar" o "Aventuras", y básate en los nombres de las experiencias que se te entregan.`

  return chatCompletion({
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
    responseFormat: { type: 'json_object' },
  });
}
