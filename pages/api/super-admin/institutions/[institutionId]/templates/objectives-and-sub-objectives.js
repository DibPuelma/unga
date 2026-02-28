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
    const levels = await prisma.levels.findMany({ take: 2 });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['objective', 'subObjective', 'coreName', 'levelNames', 'classroomNames', 'position'];

    // Example rows - mix of objectives and sub-objectives
    const exampleRows = [
      // First objective (no sub-objective)
      [
        'Objetivo Ejemplo A',
        '',
        cores.length > 0 ? cores[0].name : 'Núcleo Ejemplo',
        levels.length > 0 ? levels.map((l) => l.name).join(', ') : 'Nivel Ejemplo',
        '',
        '1',
      ],
      // Sub-objectives for objective A
      [
        'Objetivo Ejemplo A',
        'Sub-objetivo A',
        cores.length > 0 ? cores[0].name : 'Núcleo Ejemplo',
        '',
        '',
        '1',
      ],
      [
        'Objetivo Ejemplo A',
        'Sub-objetivo B',
        cores.length > 0 ? cores[0].name : 'Núcleo Ejemplo',
        '',
        '',
        '2',
      ],
      // Second objective (no sub-objective)
      [
        'Objetivo Ejemplo B',
        '',
        cores.length > 1 ? cores[1].name : cores.length > 0 ? cores[0].name : 'Núcleo Ejemplo',
        levels.length > 0 ? levels.map((l) => l.name).join(', ') : 'Nivel Ejemplo',
        '',
        '2',
      ],
      // Sub-objectives for objective B
      [
        'Objetivo Ejemplo B',
        'Sub-objetivo C',
        cores.length > 1 ? cores[1].name : cores.length > 0 ? cores[0].name : 'Núcleo Ejemplo',
        '',
        '',
        '1',
      ],
      [
        'Objetivo Ejemplo B',
        'Sub-objetivo D',
        cores.length > 1 ? cores[1].name : cores.length > 0 ? cores[0].name : 'Núcleo Ejemplo',
        '',
        '',
        '2',
      ],
    ];

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 }, // objective
      { wch: 40 }, // subObjective
      { wch: 30 }, // coreName
      { wch: 40 }, // levelNames
      { wch: 40 }, // classroomNames
      { wch: 10 }, // position
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Objetivos y Sub-objetivos');

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
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_objetivos_sub_objetivos_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de objetivos y sub-objetivos:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}

