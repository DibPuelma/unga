import { deleteClassroom } from 'db/class';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import { validateSuperAdmin } from '../upload/_utils';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!validateSuperAdmin(session)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const { institutionId, classroomId } = req.query;

  try {
    // Verify institution exists
    const institution = await prisma.institutions.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return res.status(404).json({ message: 'Institución no encontrada' });
    }

    // Verify classroom exists and belongs to institution
    const classroom = await prisma.classes.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        institutionId: true,
        deletedAt: true,
      },
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }

    if (classroom.institutionId !== institutionId) {
      return res.status(403).json({ message: 'La sala no pertenece a esta institución' });
    }

    // Check if classroom is already deleted
    if (classroom.deletedAt) {
      return res.status(400).json({ message: 'La sala ya está eliminada' });
    }

    // Delete classroom (soft delete - doesn't delete students, teachers, or objectives)
    await deleteClassroom(classroomId);

    return res.status(200).json({ message: 'Sala eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando sala:', error);
    return res.status(500).json({ message: 'Error al eliminar la sala', error: error.message });
  }
}

