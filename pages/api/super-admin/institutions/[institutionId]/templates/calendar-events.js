import * as XLSX from 'xlsx';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import moment from 'moment-timezone';

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

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['name', 'startDay', 'endDay', 'shouldShowInCalendar'];

    // Example rows with current year dates
    const currentYear = moment().year();
    const exampleRows = [
      [
        'Día del Niño',
        `${currentYear}-08-14`,
        `${currentYear}-08-14`,
        'true',
      ],
      [
        'Fiestas Patrias',
        `${currentYear}-09-18`,
        `${currentYear}-09-19`,
        'true',
      ],
      [
        'Día del Profesor',
        `${currentYear}-10-16`,
        `${currentYear}-10-16`,
        'true',
      ],
      [
        'Evento Interno',
        `${currentYear}-11-01`,
        `${currentYear}-11-03`,
        'false',
      ],
    ];

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // name
      { wch: 15 }, // startDay
      { wch: 15 }, // endDay
      { wch: 20 }, // shouldShowInCalendar
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eventos del Calendario');

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
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_eventos_calendario_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de eventos del calendario:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}

