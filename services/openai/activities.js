import { getActivitiesByIds } from 'db/activity';
import openai from './config';
import _ from 'lodash';

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

export const transformDescriptionForParents = async (description) => {
  const prompt = `
  Esta es una experiencia de aprendizaje para que una educadora de párvulos la realice en su sala, con muchos niños y niñas. Transfórmala para que un padre o una madre la pueda hacer con su hijo o hija en casa. Expresa todo en una serie de pasos a seguir. Mantén el formato HTML.

  ${description}
  `;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
    });

    return completion;
  } catch (e) {
    console.error('--------------------- OpenAi API Error ---------------------');
    console.error(e);
    return e;
  }
}

export const suggestActivities = async (prompt) => {
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
    });
    return completion;
  } catch (e) {
    console.error('--------------------- OpenAi API Error ---------------------');
    console.error(e);
    return e;
  }
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

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      temperature: 1,
      max_tokens: 2000,
      response_format: {
        type: 'json_object',
      },
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    return completion;
  } catch (e) {
    console.error('--------------------- OpenAi API Error ---------------------');
    console.error(e);
    return e;
  }
}