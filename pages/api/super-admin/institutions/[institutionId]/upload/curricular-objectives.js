import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import { config } from './_utils';

export { config };

/**
 * Cleans curricular objective names by removing numeric prefixes, quotes, newlines and trimming whitespaces
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
 * '"1. objetivo A"' -> "objetivo A"
 */
function cleanCurricularObjectiveName(name) {
  if (!name) return name;
  
  // Remove quotes and newlines first
  let cleaned = name.toString().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, ' ').trim();
  
  // Trim whitespaces first, then remove leading numbers (including decimals like 1.1, 1.3, 1,2, etc.)
  // followed by various separators (., -, ), etc.) and whitespace
  // Pattern matches: digits, optional decimal/comma with more digits, separators, and spaces
  cleaned = cleaned.replace(/^\d+[.,]?\d*[\s.\-)\/]*\s*/i, '').trim();
  
  return cleaned;
}

function countMojibakeMarkers(text) {
  if (!text) return 0;
  const matches = text.match(/[ÃÂâ�ÿþ]/g);
  return matches ? matches.length : 0;
}

function countReplacementChars(text) {
  if (!text) return 0;
  const matches = text.match(/�/g);
  return matches ? matches.length : 0;
}

function scoreTextQuality(text) {
  // Lower score means cleaner/more human-readable text.
  return countMojibakeMarkers(text) * 10 + countReplacementChars(text) * 100;
}

function fixPotentialMojibake(value) {
  if (value === null || value === undefined) return '';
  const original = value.toString();
  let best = original;
  let candidate = original;
  let bestScore = scoreTextQuality(original);

  // Some CSV/XLS exports arrive double-encoded (e.g. "ÃƒÂ³"), so try multiple repair passes.
  for (let i = 0; i < 3; i++) {
    candidate = Buffer.from(candidate, 'latin1').toString('utf8');
    const candidateScore = scoreTextQuality(candidate);
    if (candidateScore < bestScore) {
      best = candidate;
      bestScore = candidateScore;
    } else {
      break;
    }
  }

  return best;
}

function normalizeTextForLookup(value) {
  const fixed = fixPotentialMojibake(value);
  return fixed
    .replace(/[\u00B4`'’‘]/g, '') // normalize apostrophe-like chars and acute accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // remove punctuation/symbols
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

function normalizeCoreNameForLookup(value) {
  const normalized = normalizeTextForLookup(value);
  if (!normalized) return '';

  return normalized
    .split(' ')
    .map((token) => singularizeToken(token))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(str1, str2) {
  const s1 = str1 || '';
  const s2 = str2 || '';
  const len1 = s1.length;
  const len2 = s2.length;

  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

function calculateSimilarity(str1, str2) {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

function findBestMatchingCore(rawCoreName, cores) {
  const normalizedInput = normalizeTextForLookup(rawCoreName);
  const normalizedInputSingular = normalizeCoreNameForLookup(rawCoreName);

  if (!normalizedInput || !cores || cores.length === 0) return null;

  // First try exact normalized matches
  const exactMatch = cores.find((core) => {
    const coreNormalized = normalizeTextForLookup(core.name);
    const coreNormalizedSingular = normalizeCoreNameForLookup(core.name);
    return (
      coreNormalized === normalizedInput ||
      coreNormalizedSingular === normalizedInputSingular
    );
  });

  if (exactMatch) return exactMatch;

  // Then fallback to fuzzy matching for subtle wording differences.
  let bestCore = null;
  let bestScore = 0;

  for (const core of cores) {
    const coreNormalized = normalizeTextForLookup(core.name);
    const coreNormalizedSingular = normalizeCoreNameForLookup(core.name);

    const score = Math.max(
      calculateSimilarity(normalizedInput, coreNormalized),
      calculateSimilarity(normalizedInputSingular, coreNormalizedSingular)
    );

    if (score > bestScore) {
      bestScore = score;
      bestCore = core;
    }
  }

  return bestScore >= 0.82 ? bestCore : null;
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

    // Get all cores and levels for lookup
    const cores = await prisma.cores.findMany({
      where: { institutionId },
    });
    const allLevels = await prisma.levels.findMany();

    const results = {
      successful: [],
      failed: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

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

        // Clean curricular objective name (remove numeric prefixes, quotes, newlines)
        const name = cleanCurricularObjectiveName(fixPotentialMojibake(row.name));
        
        // Validate that name is not empty after cleaning
        if (!name || !name.trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Nombre no puede estar vacío después de la limpieza',
          });
          continue;
        }

        // Validate coreName is provided
        const rawCoreName = fixPotentialMojibake(row.coreName);

        if (!rawCoreName || !rawCoreName.trim()) {
          results.failed.push({
            row: rowNumber,
            name: name,
            error: 'Nombre del núcleo (coreName) es requerido',
          });
          continue;
        }

        // Find core by name, allowing subtle differences (e.g. singular/plural)
        const core = findBestMatchingCore(rawCoreName, cores);

        if (!core) {
          results.failed.push({
            row: rowNumber,
            name: name,
            error: `Núcleo "${rawCoreName}" no encontrado`,
          });
          continue;
        }
        
        const country = fixPotentialMojibake(row.country)?.trim() || null;
        const methodology = fixPotentialMojibake(row.methodology)?.trim() || null;

        // Parse levels if provided
        let levelIds = null; // null means don't update levels, [] means clear levels
        if (row.levels !== undefined && row.levels !== null) {
          const levelsValue = fixPotentialMojibake(row.levels).toString().trim();
          if (levelsValue === '') {
            // Empty string means clear all levels
            levelIds = [];
          } else {
            // Parse level names
            const levelNames = levelsValue
              .split(',')
              .map((levelName) => fixPotentialMojibake(levelName).trim())
              .filter((levelName) => levelName);
            levelIds = allLevels
              .filter((l) =>
                levelNames.some(
                  (levelName) =>
                    normalizeTextForLookup(l.name) === normalizeTextForLookup(levelName)
                )
              )
              .map((l) => l.id);
            
            // Check if any levels were not found
            const foundLevelNames = allLevels
              .filter((l) =>
                levelNames.some(
                  (levelName) =>
                    normalizeTextForLookup(l.name) === normalizeTextForLookup(levelName)
                )
              )
              .map((l) => l.name);
            const notFoundLevels = levelNames.filter(
              (levelName) =>
                !foundLevelNames.some(
                  (found) => normalizeTextForLookup(found) === normalizeTextForLookup(levelName)
                )
            );
            
            if (notFoundLevels.length > 0 && levelIds.length === 0) {
              results.failed.push({
                row: rowNumber,
                name: name,
                error: `Niveles no encontrados: ${notFoundLevels.join(', ')}`,
              });
              continue;
            }
          }
        }

        // Check if CurricularObjective already exists (by name and coreId)
        const existing = await prisma.curricularObjectives.findFirst({
          where: {
            name: name,
            coreId: core.id,
          },
          include: {
            Levels: true,
          },
        });

        if (existing) {
          // Update existing CurricularObjective
          const updateData = {
            name: name,
            country: country,
            methodology: methodology,
            institutionId: institutionId,
            coreId: core.id,
          };
          
          // Only update levels if they were provided in the Excel
          if (levelIds !== null) {
            if (levelIds.length === 0) {
              // Empty array means clear all levels
              updateData.Levels = {
                set: [],
              };
            } else {
              // Merge new levels with existing levels to support duplicates with different levels
              const existingLevelIds = existing.Levels.map((l) => l.id);
              const mergedLevelIds = [...new Set([...existingLevelIds, ...levelIds])];
              
              updateData.Levels = {
                set: mergedLevelIds.map((id) => ({ id })),
              };
            }
          }
          
          const updated = await prisma.curricularObjectives.update({
            where: { id: existing.id },
            data: updateData,
            include: {
              Levels: true,
            },
          });

          results.successful.push({
            row: rowNumber,
            name: updated.name,
            action: 'actualizado',
          });
        } else {
          // Create new CurricularObjective
          const createData = {
            name: name,
            country: country,
            methodology: methodology,
            institutionId: institutionId,
            coreId: core.id,
          };
          
          // Connect levels if provided
          if (levelIds !== null && levelIds.length > 0) {
            createData.Levels = {
              connect: levelIds.map((id) => ({ id })),
            };
          }
          
          const created = await prisma.curricularObjectives.create({
            data: createData,
            include: {
              Levels: true,
            },
          });

          results.successful.push({
            row: rowNumber,
            name: created.name,
            action: 'creado',
          });
        }
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
    console.error('Error procesando archivo de objetivos curriculares:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

