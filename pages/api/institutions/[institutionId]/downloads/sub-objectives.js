import { getSubObjectivesForInstitution } from 'db/subObjectives';
import { getServerSession } from 'next-auth';
import { authOptions } from 'pages/api/auth/[...nextauth]';

export default async (req, res) => {

  const { query: { institutionId } } = req;
  const { user: { role } } = await getServerSession(req, res, authOptions);

  if (role !== 'superAdmin') return res.status(403).end();

  const subObjectives = await getSubObjectivesForInstitution(institutionId);
  const formattedSubObjectives = subObjectives.map((subObjective) => {
    const {
      name,
      core,
      classrooms,
      levels,
      level,
      objective,
      curricularObjective,
    } = subObjective;

    return {
      'Nombre': name,
      'Núcleo': core.name,
      'Salas': classrooms?.map((classroom) => classroom.name).join(', '),
      'Niveles': levels ? levels.map(level => level.name).join(', ') : level?.name,
      'Objetivo': objective?.name,
      'Objetivo curricular': curricularObjective?.name,
    };
  });

  res.status(200).json(formattedSubObjectives);
};