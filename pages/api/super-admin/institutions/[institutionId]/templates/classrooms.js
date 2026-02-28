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

    // Get levels for example
    const levels = await prisma.levels.findMany({ take: 3 });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['name', 'level', 'mainTeacherEmail', 'associateObjectives'];

    // Example rows
    const exampleRows = levels.map((level) => [
      `Sala ${level.name}`,
      level.name,
      '',
      'true', // Default to true for associating objectives
    ]);

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // name
      { wch: 25 }, // level
      { wch: 25 }, // mainTeacherEmail
      { wch: 20 }, // associateObjectives
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salas');

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
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_salas_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de salas:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}

