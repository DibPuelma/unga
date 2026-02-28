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

  try {
    // Get all levels for example
    const allLevels = await prisma.levels.findMany({
      take: 6,
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['name', 'country', 'methodology', 'levels'];

    // Example rows
    const exampleRows = [
      [
        'Objetivo Curricular Ejemplo 1',
        'Chile',
        'Transversal',
        allLevels.length > 0 ? allLevels.slice(0, 3).map(l => l.name).join(', ') : 'Sala Cuna Menor, Sala Cuna Mayor, Nivel Medio Menor',
      ],
      [
        'Objetivo Curricular Ejemplo 2',
        'Chile',
        'Específico',
        allLevels.length > 0 ? allLevels.slice(3, 6).map(l => l.name).join(', ') : 'Nivel Medio Mayor, Primer Nivel Transición, Segundo Nivel Transición',
      ],
      [
        'Objetivo Curricular Ejemplo 3',
        '',
        '',
        '',
      ],
    ];

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 }, // name
      { wch: 20 }, // country
      { wch: 20 }, // methodology
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




