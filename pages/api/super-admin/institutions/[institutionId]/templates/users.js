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
      take: 2,
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Headers
    const headers = [
      'email',
      'firstName',
      'lastName',
      'role',
      'phoneNumber',
      'country',
      'password',
      'classrooms',
    ];

    // Example rows
    const exampleRows = [
      [
        'usuario@ejemplo.com',
        'Juan',
        'Pérez',
        'teacher',
        '+56912345678',
        'cl',
        'password123',
        classrooms.length > 0 ? classrooms[0].name : 'Sala Ejemplo',
      ],
    ];

    const data = [headers, ...exampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // email
      { wch: 15 }, // firstName
      { wch: 15 }, // lastName
      { wch: 15 }, // role
      { wch: 15 }, // phoneNumber
      { wch: 10 }, // country
      { wch: 15 }, // password
      { wch: 30 }, // classrooms
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

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
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_usuarios_${dateTimeStr}.xlsx"`);

    return res.send(buffer);
  } catch (error) {
    console.error('Error generando plantilla de usuarios:', error);
    return res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
}

