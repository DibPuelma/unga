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

    // Get classrooms for example
    const classrooms = await prisma.classes.findMany({
      where: { institutionId, deletedAt: null },
      take: 3,
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = ['firstName', 'lastName', 'rut', 'birthDate', 'classroomName'];

    // Example rows
    const exampleRows = classrooms.length > 0
      ? classrooms.map((classroom, index) => [
          `Estudiante${index + 1}`,
          `Apellido${index + 1}`,
          '', // RUT is optional
          '2020-01-15', // Example birth date in YYYY-MM-DD format
          classroom.name,
        ])
      : [
          [
            'Juan',
            'Pérez',
            '12345678-9',
            '2020-01-15',
            'Sala Ejemplo',
          ],
        ];

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // firstName
      { wch: 20 }, // lastName
      { wch: 15 }, // rut
      { wch: 15 }, // birthDate
      { wch: 30 }, // classroomName
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

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
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_estudiantes_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de estudiantes:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}




