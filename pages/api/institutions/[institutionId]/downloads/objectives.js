import { getObjectivesByInstitution } from 'db/objective';
import { getServerSession } from 'next-auth';
import { authOptions } from 'pages/api/auth/[...nextauth]';

export default async (req, res) => {

  const { query: { institutionId } } = req;
  const { user: { role } } = await getServerSession(req, res, authOptions);

  if (role !== 'superAdmin') return res.status(403).end();

  const objectives = await getObjectivesByInstitution(institutionId);
  const formattedObjectives = objectives.map((objective) => {
    const {
      name,
      classrooms,
      core,
      curricularObjective,
      levels,
    } = objective;

    return {
      'Nombre': name,
      'Salas': classrooms?.map((classroom) => classroom.name).join(', '),
      'Niveles': levels?.map((level) => level.name).join(', '),
      'Núcleo': core.name,
      'Objetivo curricular': curricularObjective?.name,
    };
  });

  res.status(200).json(formattedObjectives); 
};