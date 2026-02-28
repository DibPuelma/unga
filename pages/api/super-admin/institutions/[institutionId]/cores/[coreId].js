import { deleteCore } from 'db/core';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';

function validateSuperAdmin(session) {
  if (!session || session.user?.role !== 'superAdmin') {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!validateSuperAdmin(session)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const { institutionId, coreId } = req.query;

  try {
    // Verify institution exists
    const institution = await prisma.institutions.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return res.status(404).json({ message: 'Institución no encontrada' });
    }

    // Verify core exists and belongs to institution
    const core = await prisma.cores.findUnique({
      where: { id: coreId },
    });

    if (!core) {
      return res.status(404).json({ message: 'Núcleo no encontrado' });
    }

    if (core.institutionId !== institutionId) {
      return res.status(403).json({ message: 'El núcleo no pertenece a esta institución' });
    }

    // Delete core and soft delete associated objectives and sub-objectives
    await deleteCore(coreId);

    return res.status(200).json({ message: 'Núcleo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando núcleo:', error);
    return res.status(500).json({ message: 'Error al eliminar el núcleo', error: error.message });
  }
}


