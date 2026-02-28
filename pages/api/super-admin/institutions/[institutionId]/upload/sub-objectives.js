import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import { config } from './_utils';

export { config };

/**
 * Cleans objective/sub-objective names by removing numeric prefixes and trimming whitespaces
 * Examples: 
 * "1. objetivo A" -> "objetivo A"
 * "1- objetivo A" -> "objetivo A"
 * "1.1 objetivo A" -> "objetivo A"
 * "1,2 objetivo A" -> "objetivo A"
 * "  1. objetivo A  " -> "objetivo A"
 */
function cleanObjectiveName(name) {
  if (!name) return name;
  // Trim whitespaces first, then remove leading numbers (including decimals like 1.1, 1.3, 1,2, etc.)
  return name.trim().replace(/^\d+[.,]?\d*[\s.\-)\/]*\s*/i, '').trim();
}

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

    // Get all objectives and cores for lookup
    const objectives = await prisma.objectives.findMany({
      where: {
        Cores: { institutionId },
        deletedAt: null,
      },
      include: { Cores: true },
    });
    const cores = await prisma.cores.findMany({
      where: { institutionId },
    });

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

        // Clean names (remove numeric prefixes)
        const cleanedSubObjectiveName = cleanObjectiveName(row.name);
        const cleanedObjectiveName = row.objectiveName?.trim() ? cleanObjectiveName(row.objectiveName) : '';

        if (!cleanedObjectiveName) {
          results.failed.push({
            row: rowNumber,
            name: cleanedSubObjectiveName || '',
            error: 'Nombre del objetivo es requerido',
          });
          continue;
        }

        if (!row.coreName || !row.coreName.trim()) {
          results.failed.push({
            row: rowNumber,
            name: cleanedSubObjectiveName || '',
            error: 'Nombre del núcleo es requerido',
          });
          continue;
        }

        // Find core by name
        const core = cores.find(
          (c) => c.name.toLowerCase() === row.coreName.trim().toLowerCase()
        );

        if (!core) {
          results.failed.push({
            row: rowNumber,
            name: cleanedSubObjectiveName || '',
            error: `Núcleo "${row.coreName}" no encontrado`,
          });
          continue;
        }

        // Find objective by name and core (using cleaned name)
        const objective = objectives.find(
          (obj) =>
            obj.name.toLowerCase() === cleanedObjectiveName.toLowerCase() &&
            obj.coreId === core.id
        );

        if (!objective) {
          results.failed.push({
            row: rowNumber,
            name: cleanedSubObjectiveName || '',
            error: `Objetivo "${cleanedObjectiveName}" no encontrado en el núcleo "${row.coreName}"`,
          });
          continue;
        }

        // Get objective's classrooms and levels
        const objectiveRecord = await prisma.objectives.findUnique({
          where: { id: objective.id },
          include: {
            Classes: { include: { Levels: true } },
            ObjectiveLevels: {
              include: {
                Levels: true,
              },
            },
          },
        });

        if (!objectiveRecord) {
          results.failed.push({
            row: rowNumber,
            name: cleanedSubObjectiveName || '',
            error: `No se pudo obtener los detalles del objetivo "${cleanedObjectiveName}"`,
          });
          continue;
        }

        const levelIds = objectiveRecord.ObjectiveLevels.map((ol) => ol.Levels.id);
        const classroomIds = objectiveRecord.Classes.map((c) => c.id);

        // Create sub-objective
        const subObjective = await prisma.subObjectives.create({
          data: {
            name: cleanedSubObjectiveName,
            objectiveId: objective.id,
            coreId: core.id,
            institutionId,
            createdById: session.user.id,
            curricularObjectiveId: objectiveRecord.curricularObjectiveId || null,
            position: row.position ? parseInt(row.position) : null,
            Classes: {
              connect: classroomIds.map((id) => ({ id })),
            },
            Levels: {
              connect: levelIds.map((id) => ({ id })),
            },
          },
        });

        results.successful.push({
          row: rowNumber,
          name: subObjective.name,
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
    console.error('Error procesando archivo de sub-objetivos:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

