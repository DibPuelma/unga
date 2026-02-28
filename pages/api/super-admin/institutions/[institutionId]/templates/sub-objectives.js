import * as XLSX from 'xlsx';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!validateSuperAdmin(session)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const { institutionId } = req.query;

  try {
    // Verify institution exists
    const institution = await prisma.institutions.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return res.status(404).json({ message: 'Institución no encontrada' });
    }

    // Get objectives and cores for example
    const objectives = await prisma.objectives.findMany({
      where: {
        Cores: { institutionId },
        deletedAt: null,
      },
      include: { Cores: true },
      take: 2,
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['name', 'objectiveName', 'coreName', 'position'];

    // Example rows
    const exampleRows = objectives.map((objective, index) => [
      `Sub-objetivo ${index + 1}`,
      objective.name,
      objective.core.name,
      index + 1,
    ]);

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 }, // name
      { wch: 40 }, // objectiveName
      { wch: 30 }, // coreName
      { wch: 10 }, // position
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sub-objetivos');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate date-time string for filename
    const now = new Date();
    const dateTimeStr = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '');

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_sub_objetivos_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de sub-objetivos:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}

