import { getClassroom } from 'db/class';
import { addClassroomToSubObjectivesByLevelAndInstitution } from 'db/subObjectives';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const { classroomId } = req.query;
  const { user } = session;
  const { role, classrooms, institution } = user;

  // Check authorization - only teachers, coordinators, principals, and super admins
  if (role === 'teacher' || role === 'coordinator') {
    if (!classrooms.includes(classroomId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }
  } else if (role === 'principal') {
    const classroom = await getClassroom(classroomId);
    if (!classroom || classroom.institutionId !== institution.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }
  } else if (role !== 'superAdmin') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    const classroom = await getClassroom(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }

    // Get levelId and institutionId from classroom
    // getClassroom returns transformed data, so we need to check both possible field names
    const levelId = classroom.levelId || classroom.level?.id;
    const institutionId = classroom.institutionId || classroom.institution?.id;

    if (!levelId || !institutionId) {
      return res.status(400).json({ 
        message: 'No se pudo obtener el nivel o la institución de la sala' 
      });
    }

    // Associate sub-objectives for this classroom
    await addClassroomToSubObjectivesByLevelAndInstitution(
      classroomId,
      levelId,
      institutionId
    );

    return res.status(200).json({ 
      message: 'Sub-objetivos asociados exitosamente',
      classroomId 
    });
  } catch (error) {
    console.error('Error asociando sub-objetivos:', error);
    return res.status(500).json({ 
      message: 'Error al asociar sub-objetivos', 
      error: error.message 
    });
  }
}

