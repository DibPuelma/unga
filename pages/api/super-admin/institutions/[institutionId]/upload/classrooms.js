import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { createClassroom } from 'db/class';
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

    // Get all levels for lookup
    const allLevels = await prisma.levels.findMany();

    const results = {
      successful: [],
      failed: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.name || !row.name.trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Nombre es requerido',
          });
          continue;
        }

        if (!row.level || !row.level.trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Nivel es requerido',
          });
          continue;
        }

        // Find level by name
        const level = allLevels.find(
          (l) => l.name.toLowerCase() === row.level.trim().toLowerCase()
        );

        if (!level) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: `Nivel "${row.level}" no encontrado`,
          });
          continue;
        }

        // Find main teacher if provided
        let mainTeacherId = null;
        if (row.mainTeacherEmail && row.mainTeacherEmail.trim()) {
          const teacher = await prisma.user.findUnique({
            where: { email: row.mainTeacherEmail.trim() },
          });

          if (teacher && teacher.institutionId === institutionId) {
            mainTeacherId = teacher.id;
          }
        }

        // Create classroom (objectives are automatically associated based on level)
        const classroom = await createClassroom({
          name: row.name.trim(),
          level: level.id,
          institution: institutionId,
          mainTeacher: mainTeacherId,
        });

        results.successful.push({
          row: rowNumber,
          name: classroom.name,
        });
      } catch (error) {
        results.failed.push({
          row: rowNumber,
          name: row.name || '',
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
    console.error('Error procesando archivo de salas:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

