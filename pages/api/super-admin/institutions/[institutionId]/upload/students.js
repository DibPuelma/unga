import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { createStudent } from 'db/student';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import { config } from './_utils';

export { config };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Parse uploaded file
    const { files } = await parseForm(req);
    const file = files.file;

    if (!file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Handle both single file and array of files
    const fileObj = Array.isArray(file) ? file[0] : file;
    const filePath = fileObj.filepath || fileObj.path;
    
    if (!filePath) {
      return res.status(400).json({ message: 'Error al procesar el archivo. Asegúrate de que el archivo sea válido.' });
    }
    
    const rows = parseXLSX(filePath);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío' });
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Get existing classrooms for lookup
    const classrooms = await prisma.classes.findMany({
      where: { institutionId, deletedAt: null },
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Validate required fields
        if (!row.firstName || !row.firstName.trim()) {
          results.failed.push({
            row: rowNumber,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Sin nombre',
            error: 'Nombre (firstName) es requerido',
          });
          continue;
        }

        if (!row.lastName || !row.lastName.trim()) {
          results.failed.push({
            row: rowNumber,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Sin nombre',
            error: 'Apellido (lastName) es requerido',
          });
          continue;
        }

        if (!row.classroomName || !row.classroomName.trim()) {
          results.failed.push({
            row: rowNumber,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
            error: 'Nombre de sala (classroomName) es requerido',
          });
          continue;
        }

        // Find classroom by name
        const classroom = classrooms.find(
          (c) => c.name.toLowerCase() === row.classroomName.trim().toLowerCase()
        );

        if (!classroom) {
          results.failed.push({
            row: rowNumber,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
            error: `Sala "${row.classroomName}" no encontrada`,
          });
          continue;
        }

        // Parse birth date if provided
        let birthDate = null;
        if (row.birthDate && row.birthDate.trim()) {
          const parsedDate = new Date(row.birthDate.trim());
          if (isNaN(parsedDate.getTime())) {
            results.failed.push({
              row: rowNumber,
              name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
              error: 'Fecha de nacimiento inválida. Use formato YYYY-MM-DD',
            });
            continue;
          }
          birthDate = parsedDate;
        }

        // Create student
        const student = await createStudent({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          rut: row.rut?.trim() || null,
          birthDate: birthDate,
          classroom: classroom.id,
          institution: institutionId,
        });

        results.successful.push({
          row: rowNumber,
          name: `${student.firstName} ${student.lastName}`,
          classroom: classroom.name,
        });
      } catch (error) {
        results.failed.push({
          row: rowNumber,
          name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Sin nombre',
          error: error.message || 'Error desconocido',
        });
      }
    }

    return res.status(200).json({
      message: `Procesados ${rows.length} registros`,
      successful: results.successful.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error) {
    console.error('Error procesando archivo de estudiantes:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}




