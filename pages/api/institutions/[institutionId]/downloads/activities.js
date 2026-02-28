import { getActivitiesByInstitution } from 'db/activity';
import { getServerSession } from 'next-auth';
import { authOptions } from 'pages/api/auth/[...nextauth]';

export default async (req, res) => {

  const { query: { institutionId } } = req;
  const { user: { role } } = await getServerSession(req, res, authOptions);

  if (role !== 'superAdmin') return res.status(403).end();

  const activities = await getActivitiesByInstitution(institutionId, 100000);
  const formattedActivities = activities.map(activity => {
    const {
      name,
      description,
      ideaOrigin,
      ideaOriginDetails,
      familyParticipation,
      adultRole,
      assets,
      recommendedLevels,
      cores,
      objectives,
      subObjectives,
      curricularObjectives,
      consequentialCurricularObjectives,
    } = activity;

    return {
      'Nombre': name,
      'Descripción': description,
      'Origen de la idea': ideaOrigin,
      'Detalles del origen de la idea': ideaOriginDetails,
      'Participación de la familia': familyParticipation,
      'Rol del adulto': adultRole,
      'Archivos': Object.values(assets).map(asset => asset.secure_url).join(', '),
      'Niveles recomendados': recommendedLevels.map(level => level.name).join(', '),
      'Núcleos': cores.map(core => core.name).join(', '),
      'Objetivos': objectives.map(objective => objective.name).join(', '),
      'Sub objetivos': subObjectives.map(subObjective => subObjective.name).join(', '),
      'Objetivos curriculares': curricularObjectives.map(curricularObjective => curricularObjective.name).join(', '),
      'Objetivos específicos': consequentialCurricularObjectives.map(consequentialCurricularObjective => consequentialCurricularObjective.name).join(', '),
    };
  });

  res.status(200).json(formattedActivities); 
};