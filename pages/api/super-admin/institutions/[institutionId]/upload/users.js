import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { createUser } from 'db/user';
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
        if (!row.email || !row.email.trim()) {
          results.failed.push({
            row: rowNumber,
            email: row.email || '',
            error: 'Email es requerido',
          });
          continue;
        }

        const email = row.email.trim();

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email },
        });

        if (existingUser) {
          // User exists, check if classrooms need to be associated
          let classroomIds = [];
          if (row.classrooms) {
            const classroomNames = row.classrooms.split(',').map((name) => name.trim());
            classroomIds = classrooms
              .filter((c) => classroomNames.some((name) => c.name.toLowerCase() === name.toLowerCase()))
              .map((c) => c.id);
          }

          // Merge new classrooms with existing ones (avoid duplicates)
          if (classroomIds.length > 0) {
            const existingClassrooms = existingUser.classrooms || [];
            const mergedClassrooms = [...new Set([...existingClassrooms, ...classroomIds])];
            
            // Only update if there are new classrooms to add
            if (mergedClassrooms.length > existingClassrooms.length) {
              await prisma.users.update({
                where: { id: existingUser.id },
                data: { classrooms: mergedClassrooms },
              });
            }
          }

          results.successful.push({
            row: rowNumber,
            email: existingUser.email,
            message: 'Usuario ya existía, aulas actualizadas si era necesario',
          });
          continue;
        }

        // Parse classrooms if provided
        let classroomIds = [];
        if (row.classrooms) {
          const classroomNames = row.classrooms.split(',').map((name) => name.trim());
          classroomIds = classrooms
            .filter((c) => classroomNames.some((name) => c.name.toLowerCase() === name.toLowerCase()))
            .map((c) => c.id);
        }

        // Create user
        const user = await createUser({
          email,
          firstName: row.firstName?.trim() || null,
          lastName: row.lastName?.trim() || null,
          role: row.role?.trim() || null,
          phoneNumber: row.phoneNumber?.trim() || null,
          country: row.country?.trim() || institution.country || null,
          password: row.password?.trim() || null,
          classrooms: classroomIds,
          institution: institutionId,
        });

        results.successful.push({
          row: rowNumber,
          email: user.email,
        });
      } catch (error) {
        results.failed.push({
          row: rowNumber,
          email: row.email || '',
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
    console.error('Error procesando archivo de usuarios:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

