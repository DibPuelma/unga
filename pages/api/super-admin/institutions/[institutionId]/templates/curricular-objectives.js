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

    // Get cores and levels for example
    const cores = await prisma.cores.findMany({
      where: { institutionId },
      take: 2,
    });
    const levels = await prisma.levels.findMany({ take: 3 });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['name', 'coreName', 'country', 'methodology', 'levels'];

    // Example rows
    const exampleRows = cores.map((core, index) => [
      `Objetivo Curricular ${index + 1}`,
      core.name,
      institution.country || 'Chile',
      '', // methodology is optional
      levels.length > 0 ? levels.map((l) => l.name).join(', ') : 'Nivel Ejemplo',
    ]);

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 50 }, // name
      { wch: 30 }, // coreName
      { wch: 20 }, // country
      { wch: 30 }, // methodology
      { wch: 50 }, // levels
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Objetivos Curriculares');

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
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_objetivos_curriculares_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de objetivos curriculares:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}

