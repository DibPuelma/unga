import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { createObjectiveForClassroomsMassively } from 'db/objective';
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
 * "1.objetivo A" -> "objetivo A"
 * "1) objetivo A" -> "objetivo A"
 * "1.1 objetivo A" -> "objetivo A"
 * "1.3 objetivo A" -> "objetivo A"
 * "1,2 objetivo A" -> "objetivo A"
 * "1,3 objetivo A" -> "objetivo A"
 * "  1. objetivo A  " -> "objetivo A"
 */
function cleanObjectiveName(name) {
  if (!name) return name;
  
  // Remove quotes and newlines first
  let cleaned = name.toString().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, ' ').trim();
  
  // Trim whitespaces first, then remove leading numbers (including decimals like 1.1, 1.3, 1,2, etc.)
  // followed by various separators (., -, ), etc.) and whitespace
  // Pattern matches: digits, optional decimal/comma with more digits, separators, and spaces
  cleaned = cleaned.replace(/^\d+[.,]?\d*[\s.\-)\/]*\s*/i, '').trim();
  
  return cleaned;
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

    // Get all cores, classrooms, and levels for lookup
    const cores = await prisma.cores.findMany({
      where: { institutionId },
    });
    const classrooms = await prisma.classes.findMany({
      where: { institutionId, deletedAt: null },
    });
    const allLevels = await prisma.levels.findMany();

    const results = {
      objectives: { successful: [], failed: [] },
      subObjectives: { successful: [], failed: [] },
    };

    // Separate objectives and sub-objectives
    const objectivesToCreate = [];
    const subObjectivesToCreate = [];
    const objectivesMap = new Map(); // Track objectives by name+core to avoid duplicates

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.objective || !row.objective.trim()) {
          results.objectives.failed.push({
            row: rowNumber,
            name: row.objective || '',
            error: 'Nombre del objetivo es requerido',
          });
          continue;
        }

        // Clean objective and sub-objective names (remove numeric prefixes)
        const objectiveName = cleanObjectiveName(row.objective);
        const subObjectiveName = row.subObjective?.trim() ? cleanObjectiveName(row.subObjective) : '';
        const hasSubObjective = subObjectiveName.length > 0;

        // Clean and validate coreName
        const coreName = row.coreName ? row.coreName.toString().trim().replace(/["']/g, '') : '';
        if (!coreName) {
          const target = hasSubObjective ? results.subObjectives : results.objectives;
          target.failed.push({
            row: rowNumber,
            name: hasSubObjective ? subObjectiveName : objectiveName,
            error: 'Nombre del núcleo es requerido',
          });
          continue;
        }

        // Find core by name
        const core = cores.find(
          (c) => c.name.toLowerCase() === coreName.toLowerCase()
        );

        if (!core) {
          const target = hasSubObjective ? results.subObjectives : results.objectives;
          target.failed.push({
            row: rowNumber,
            name: hasSubObjective ? subObjectiveName : objectiveName,
            error: `Núcleo "${coreName}" no encontrado`,
          });
          continue;
        }

        // Always process the objective first (even if there's a sub-objective)
        // This ensures parent objectives exist before creating sub-objectives
        const objectiveKey = `${objectiveName.toLowerCase()}_${core.id}`;
        
        // Parse levels if provided
        let levelIds = [];
        if (row.levelNames && row.levelNames.trim()) {
          const levelNames = row.levelNames.split(',').map((name) => name.trim());
          levelIds = allLevels
            .filter((l) => levelNames.some((name) => l.name.toLowerCase() === name.toLowerCase()))
            .map((l) => l.id);
          
          if (levelIds.length === 0) {
            const target = hasSubObjective ? results.subObjectives : results.objectives;
            target.failed.push({
              row: rowNumber,
              name: hasSubObjective ? subObjectiveName : objectiveName,
              error: `No se encontraron niveles con los nombres proporcionados: ${row.levelNames}`,
            });
            continue;
          }
        }

        // Parse classrooms if provided (can be provided alongside levels)
        let classroomIds = [];
        if (row.classroomNames && row.classroomNames.trim()) {
          const classroomNames = row.classroomNames.split(',').map((name) => name.trim());
          classroomIds = classrooms
            .filter((c) => classroomNames.some((name) => c.name.toLowerCase() === name.toLowerCase()))
            .map((c) => c.id);
          
          // Validate that all provided classroom names were found
          const foundClassroomNames = classrooms
            .filter((c) => classroomNames.some((name) => c.name.toLowerCase() === name.toLowerCase()))
            .map((c) => c.name);
          const notFoundClassrooms = classroomNames.filter(
            (name) => !foundClassroomNames.some((found) => found.toLowerCase() === name.toLowerCase())
          );
          
          if (notFoundClassrooms.length > 0) {
            const target = hasSubObjective ? results.subObjectives : results.objectives;
            target.failed.push({
              row: rowNumber,
              name: hasSubObjective ? subObjectiveName : objectiveName,
              error: `No se encontraron salas con los nombres: ${notFoundClassrooms.join(', ')}`,
            });
            continue;
          }
        }

        // At least levels or classrooms must be provided for objectives without sub-objectives
        // For rows with sub-objectives, we'll try to create the objective even without level/classroom info
        // (it might be merged with info from other rows, or we'll look it up from DB when creating sub-objectives)
        if (levelIds.length === 0 && classroomIds.length === 0 && !hasSubObjective) {
          results.objectives.failed.push({
            row: rowNumber,
            name: objectiveName,
            error: 'Debe proporcionar al menos niveles (levelNames) o salas (classroomNames)',
          });
          continue;
        }

        // Process objective (create or merge)
        if (objectivesMap.has(objectiveKey)) {
          // Merge level/classroom info with existing objective
          const existingIndex = objectivesMap.get(objectiveKey);
          const existing = objectivesToCreate[existingIndex];
          
          // Merge levelIds (use Set to avoid duplicates)
          if (levelIds.length > 0) {
            const existingLevelIds = existing.levelIds || [];
            existing.levelIds = [...new Set([...existingLevelIds, ...levelIds])];
          }
          
          // Merge classroomIds (use Set to avoid duplicates)
          if (classroomIds.length > 0) {
            const existingClassroomIds = existing.classroomsIds || [];
            existing.classroomsIds = [...new Set([...existingClassroomIds, ...classroomIds])];
          }
          
          // Update position if provided and existing doesn't have one
          if (row.position && !existing.position) {
            existing.position = parseInt(row.position);
          }
        } else {
          // Create new objective entry
          // If we don't have level/classroom info but have a sub-objective, create with undefined
          // (the sub-objective creation will look up the objective from DB if needed)
          const index = objectivesToCreate.push({
            name: objectiveName,
            coreId: core.id,
            levelIds: levelIds.length > 0 ? levelIds : undefined,
            classroomsIds: classroomIds.length > 0 ? classroomIds : undefined,
            position: row.position ? parseInt(row.position) : null,
            rowNumber,
          }) - 1;
          
          objectivesMap.set(objectiveKey, index);
        }

        // Handle sub-objective if present
        if (hasSubObjective) {
          subObjectivesToCreate.push({
            name: subObjectiveName,
            objectiveName: objectiveName,
            coreName: coreName,
            coreId: core.id,
            position: row.position ? parseInt(row.position) : null,
            rowNumber,
          });
        }
      } catch (error) {
        const hasSubObjective = row.subObjective && row.subObjective.trim();
        const target = hasSubObjective ? results.subObjectives : results.objectives;
        target.failed.push({
          row: rowNumber,
          name: hasSubObjective ? (row.subObjective?.trim() || '') : (row.objective?.trim() || ''),
          error: error.message || 'Error desconocido',
        });
      }
    }

    // First, create all objectives
    const createdObjectivesMap = new Map(); // Map objective name to objective ID

    if (objectivesToCreate.length > 0) {
      try {
        const createdObjectives = await createObjectiveForClassroomsMassively({
          objectives: objectivesToCreate.map((obj) => {
            const objectiveData = {
              name: obj.name,
              coreId: obj.coreId,
              position: obj.position,
            };
            
            if (obj.levelIds && obj.levelIds.length > 0) {
              objectiveData.levelIds = obj.levelIds;
            }
            
            if (obj.classroomsIds && obj.classroomsIds.length > 0) {
              objectiveData.classroomsIds = obj.classroomsIds;
            }
            
            return objectiveData;
          }),
          user: session.user,
        });

        // Map created objectives by name+coreId (already cleaned)
        createdObjectives.forEach((obj, index) => {
          const originalObj = objectivesToCreate[index];
          const mapKey = `${originalObj.name.toLowerCase()}_${originalObj.coreId}`;
          createdObjectivesMap.set(mapKey, obj);
          results.objectives.successful.push({
            row: originalObj.rowNumber,
            name: obj.name,
          });
        });
      } catch (error) {
        objectivesToCreate.forEach((obj) => {
          results.objectives.failed.push({
            row: obj.rowNumber,
            name: obj.name,
            error: error.message || 'Error al crear objetivo',
          });
        });
      }
    }

    // Then, create all sub-objectives
    if (subObjectivesToCreate.length > 0) {
      // Get existing objectives from database (including newly created ones)
      const allObjectives = await prisma.objectives.findMany({
        where: {
          Cores: { institutionId },
          deletedAt: null,
        },
        include: { Cores: true },
      });

      for (const subObj of subObjectivesToCreate) {
        try {
          // Clean objective name for lookup
          const cleanedObjectiveNameForLookup = cleanObjectiveName(subObj.objectiveName);
          
          // Find objective by name and core (check both newly created and existing)
          // Use coreId in the key to avoid collisions
          const lookupKey = `${cleanedObjectiveNameForLookup.toLowerCase()}_${subObj.coreId}`;
          let objective = createdObjectivesMap.get(lookupKey);
          
          if (!objective) {
            // Try to find in newly created objectives by name+core
            const createdObjs = Array.from(createdObjectivesMap.values());
            objective = createdObjs.find(
              (obj) =>
                cleanObjectiveName(obj.name).toLowerCase() === cleanedObjectiveNameForLookup.toLowerCase() &&
                obj.coreId === subObj.coreId
            );
          }
          
          if (!objective) {
            // Look in existing database objectives
            objective = allObjectives.find(
              (obj) =>
                cleanObjectiveName(obj.name).toLowerCase() === cleanedObjectiveNameForLookup.toLowerCase() &&
                obj.coreId === subObj.coreId
            );
          }

          if (!objective) {
            results.subObjectives.failed.push({
              row: subObj.rowNumber,
              name: subObj.name,
              error: `Objetivo "${cleanedObjectiveNameForLookup}" no encontrado en el núcleo "${subObj.coreName}"`,
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
            results.subObjectives.failed.push({
              row: subObj.rowNumber,
              name: subObj.name,
              error: `No se pudo obtener los detalles del objetivo "${subObj.objectiveName}"`,
            });
            continue;
          }

          const levelIds = objectiveRecord.ObjectiveLevels.map((ol) => ol.Levels.id);
          const classroomIds = objectiveRecord.Classes.map((c) => c.id);

          // Create sub-objective
          const subObjective = await prisma.subObjectives.create({
            data: {
              name: subObj.name,
              objectiveId: objective.id,
              coreId: subObj.coreId,
              institutionId,
              createdById: session.user.id,
              curricularObjectiveId: objectiveRecord.curricularObjectiveId || null,
              position: subObj.position,
              Classes: {
                connect: classroomIds.map((id) => ({ id })),
              },
              Levels: {
                connect: levelIds.map((id) => ({ id })),
              },
            },
          });

          results.subObjectives.successful.push({
            row: subObj.rowNumber,
            name: subObjective.name,
          });
        } catch (error) {
          results.subObjectives.failed.push({
            row: subObj.rowNumber,
            name: subObj.name,
            error: error.message || 'Error desconocido',
          });
        }
      }
    }

    const totalSuccessful = results.objectives.successful.length + results.subObjectives.successful.length;
    const totalFailed = results.objectives.failed.length + results.subObjectives.failed.length;

    return res.status(200).json({
      message: `Procesados ${rows.length} registros`,
      objectives: {
        successful: results.objectives.successful.length,
        failed: results.objectives.failed.length,
      },
      subObjectives: {
        successful: results.subObjectives.successful.length,
        failed: results.subObjectives.failed.length,
      },
      totalSuccessful,
      totalFailed,
      details: results,
    });
  } catch (error) {
    console.error('Error procesando archivo de objetivos y sub-objetivos:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

