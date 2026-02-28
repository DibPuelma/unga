import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { createObjectiveForClassroomsMassively } from 'db/objective';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import { config } from './_utils';

export { config };

/**
 * Cleans objective names by removing numeric prefixes and trimming whitespaces
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

function countMojibakeMarkers(text) {
  if (!text) return 0;
  const matches = text.match(/[ÃÂâ�]/g);
  return matches ? matches.length : 0;
}

function fixPotentialMojibake(value) {
  if (value === null || value === undefined) return '';
  const original = value.toString();
  const repaired = Buffer.from(original, 'latin1').toString('utf8');
  return countMojibakeMarkers(repaired) < countMojibakeMarkers(original) ? repaired : original;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalizes text for comparison by cleaning, removing extra whitespace, and converting to lowercase
 */
function normalizeTextForComparison(text) {
  if (!text) return '';
  
  // First clean using the objective name cleaning function
  let normalized = cleanObjectiveName(fixPotentialMojibake(text));
  
  // Normalize whitespace: replace multiple spaces/tabs/newlines with single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Normalize apostrophe-like chars and remove diacritics
  normalized = normalized
    .replace(/[\u00B4`'’‘]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Remove punctuation/symbols
  normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, ' ');
  
  // Remove leading/trailing whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Convert to lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase();
  
  return normalized;
}

function normalizeTextForLookup(text) {
  if (!text) return '';
  return fixPotentialMojibake(text)
    .replace(/[\u00B4`'’‘]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function singularizeToken(token) {
  if (!token) return token;
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function normalizeCoreNameForLookup(text) {
  const normalized = normalizeTextForLookup(text);
  if (!normalized) return '';

  return normalized
    .split(' ')
    .map((token) => singularizeToken(token))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatchingEntity(searchName, entities, options = {}) {
  const {
    minSimilarity = 0.9,
    useSingular = false,
  } = options;

  if (!searchName || !entities || entities.length === 0) return null;

  const normalizedInput = normalizeTextForLookup(searchName);
  const normalizedInputSingular = useSingular ? normalizeCoreNameForLookup(searchName) : '';
  if (!normalizedInput) return null;

  const exactMatch = entities.find((entity) => {
    const normalizedEntity = normalizeTextForLookup(entity.name);
    if (normalizedEntity === normalizedInput) return true;
    if (useSingular) {
      return normalizeCoreNameForLookup(entity.name) === normalizedInputSingular;
    }
    return false;
  });
  if (exactMatch) return exactMatch;

  let bestMatch = null;
  let bestSimilarity = 0;

  for (const entity of entities) {
    const normalizedEntity = normalizeTextForLookup(entity.name);
    let similarity = calculateSimilarity(normalizedInput, normalizedEntity);

    if (useSingular) {
      similarity = Math.max(
        similarity,
        calculateSimilarity(normalizedInputSingular, normalizeCoreNameForLookup(entity.name))
      );
    }

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = entity;
    }
  }

  return bestSimilarity >= minSimilarity ? bestMatch : null;
}

/**
 * Calculates similarity ratio between two strings (0-1, where 1 is identical)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

/**
 * Finds the best matching curricular objective using fuzzy matching (95% threshold)
 */
function findBestMatchingCurricularObjective(searchName, curricularObjectives) {
  if (!searchName || !curricularObjectives || curricularObjectives.length === 0) {
    return null;
  }

  // Normalize the search name
  const normalizedSearchName = normalizeTextForComparison(searchName);
  
  if (!normalizedSearchName) {
    return null;
  }

  let bestMatch = null;
  let bestSimilarity = 0;

  for (const co of curricularObjectives) {
    // Normalize the curricular objective name
    const normalizedCoName = normalizeTextForComparison(co.name);
    
    if (!normalizedCoName) {
      continue;
    }
    
    // Calculate similarity between normalized strings
    const similarity = calculateSimilarity(normalizedSearchName, normalizedCoName);
    
    if (similarity >= 0.95 && similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = co;
    }
  }

  return bestMatch;
}

function buildObjectiveUniquenessKey({ name, coreId, levelIds, classroomIds }) {
  const normalizedName = normalizeTextForComparison(name);
  const normalizedLevelIds = levelIds && levelIds.length > 0
    ? [...new Set(levelIds)].sort().join(',')
    : 'null';
  const normalizedClassroomIds = classroomIds && classroomIds.length > 0
    ? [...new Set(classroomIds)].sort().join(',')
    : 'null';

  return `${coreId}::${normalizedName}::${normalizedLevelIds}::${normalizedClassroomIds}`;
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

    // Get all cores, classrooms, levels, and curricular objectives for lookup
    const cores = await prisma.cores.findMany({
      where: { institutionId },
    });
    const classrooms = await prisma.classes.findMany({
      where: { institutionId, deletedAt: null },
    });
    const allLevels = await prisma.levels.findMany();
    const allCurricularObjectives = await prisma.curricularObjectives.findMany({
      where: { institutionId },
    });
    const existingObjectives = await prisma.objectives.findMany({
      where: {
        deletedAt: null,
        Cores: {
          institutionId,
        },
      },
      include: {
        ObjectiveLevels: {
          include: {
            Levels: true,
          },
        },
        Classes: true,
      },
    });

    const results = {
      successful: [],
      failed: [],
    };

    const objectivesToCreate = [];
    const queuedObjectiveKeys = new Set();
    const existingObjectiveKeys = new Set(
      existingObjectives.map((objective) => buildObjectiveUniquenessKey({
        name: objective.name,
        coreId: objective.coreId,
        levelIds: objective.ObjectiveLevels.map((ol) => ol.Levels.id),
        classroomIds: objective.Classes.map((c) => c.id),
      }))
    );

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

        // Clean objective name (remove numeric prefixes)
        const cleanedName = cleanObjectiveName(fixPotentialMojibake(row.name));

        const rawCoreName = fixPotentialMojibake(row.coreName);

        if (!rawCoreName || !rawCoreName.trim()) {
          results.failed.push({
            row: rowNumber,
            name: cleanedName || '',
            error: 'Nombre del núcleo es requerido',
          });
          continue;
        }

        // Find core by name with fuzzy support for subtle differences
        const core = findBestMatchingEntity(rawCoreName, cores, {
          minSimilarity: 0.82,
          useSingular: true,
        });

        if (!core) {
          results.failed.push({
            row: rowNumber,
            name: cleanedName || '',
            error: `Núcleo "${rawCoreName}" no encontrado`,
          });
          continue;
        }

        // Parse levels if provided
        let levelIds = [];
        if (row.levelNames && row.levelNames.trim()) {
          const levelNames = fixPotentialMojibake(row.levelNames)
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name);

          const matchedLevels = [];
          for (const levelName of levelNames) {
            const matchedLevel = findBestMatchingEntity(levelName, allLevels, { minSimilarity: 0.88 });
            if (matchedLevel) {
              matchedLevels.push(matchedLevel);
            }
          }

          levelIds = [...new Set(matchedLevels.map((l) => l.id))];
          
          if (levelIds.length === 0) {
            results.failed.push({
              row: rowNumber,
              name: row.name || '',
              error: `No se encontraron niveles con los nombres proporcionados: ${row.levelNames}`,
            });
            continue;
          }
        }

        // Parse classrooms if provided (can be provided alongside levels)
        let classroomIds = [];
        if (row.classroomNames && row.classroomNames.trim()) {
          const classroomNames = fixPotentialMojibake(row.classroomNames)
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name);

          const matchedClassrooms = [];
          const notFoundClassrooms = [];

          for (const classroomName of classroomNames) {
            const matchedClassroom = findBestMatchingEntity(classroomName, classrooms, { minSimilarity: 0.88 });
            if (matchedClassroom) {
              matchedClassrooms.push(matchedClassroom);
            } else {
              notFoundClassrooms.push(classroomName);
            }
          }

          classroomIds = [...new Set(matchedClassrooms.map((c) => c.id))];
          
          if (notFoundClassrooms.length > 0) {
            results.failed.push({
              row: rowNumber,
              name: row.name || '',
              error: `No se encontraron salas con los nombres: ${notFoundClassrooms.join(', ')}`,
            });
            continue;
          }
        }

        // At least levels or classrooms must be provided
        if (levelIds.length === 0 && classroomIds.length === 0) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Debe proporcionar al menos niveles (levelNames) o salas (classroomNames)',
          });
          continue;
        }

        // Handle curricular objective matching if provided
        let curricularObjectiveId = null;
        if (row.curricularObjectiveName && row.curricularObjectiveName.trim()) {
          const cleanedCurricularObjectiveName = cleanObjectiveName(fixPotentialMojibake(row.curricularObjectiveName));
          const matchingCurricularObjective = findBestMatchingCurricularObjective(
            cleanedCurricularObjectiveName,
            allCurricularObjectives
          );

          if (matchingCurricularObjective) {
            curricularObjectiveId = matchingCurricularObjective.id;
          } else {
            results.failed.push({
              row: rowNumber,
              name: cleanedName || '',
              error: `No se encontró un objetivo curricular que coincida con "${cleanedCurricularObjectiveName}" (similaridad mínima: 95%)`,
            });
            continue;
          }
        }

        const objectiveUniquenessKey = buildObjectiveUniquenessKey({
          name: cleanedName,
          coreId: core.id,
          levelIds,
          classroomIds,
        });

        if (existingObjectiveKeys.has(objectiveUniquenessKey) || queuedObjectiveKeys.has(objectiveUniquenessKey)) {
          results.failed.push({
            row: rowNumber,
            name: cleanedName || '',
            error: 'Objetivo duplicado (mismo nombre, niveles y salas), omitido',
          });
          continue;
        }

        queuedObjectiveKeys.add(objectiveUniquenessKey);

          objectivesToCreate.push({
            name: cleanedName,
            coreId: core.id,
            levelIds: levelIds.length > 0 ? levelIds : undefined,
            classroomsIds: classroomIds.length > 0 ? classroomIds : undefined,
            position: row.position ? parseInt(row.position) : null,
            curricularObjectiveId,
            rowNumber,
          });
      } catch (error) {
        results.failed.push({
          row: rowNumber,
          name: row.name || '',
          error: error.message || 'Error desconocido',
        });
      }
    }

    // Create objectives in bulk
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

            if (obj.curricularObjectiveId) {
              objectiveData.curricularObjectiveId = obj.curricularObjectiveId;
            }
            
            return objectiveData;
          }),
          user: session.user,
        });

        objectivesToCreate.forEach((obj, index) => {
          results.successful.push({
            row: obj.rowNumber,
            name: createdObjectives[index]?.name || obj.name,
          });
        });
      } catch (error) {
        objectivesToCreate.forEach((obj) => {
          results.failed.push({
            row: obj.rowNumber,
            name: obj.name,
            error: error.message || 'Error al crear objetivo',
          });
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
    console.error('Error procesando archivo de objetivos:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

