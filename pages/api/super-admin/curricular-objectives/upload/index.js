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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!validateSuperAdmin(session)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
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
        const name = cleanCurricularObjectiveName(row.name);
        
        // Validate that name is not empty after cleaning
        if (!name || !name.trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Nombre no puede estar vacío después de la limpieza',
          });
          continue;
        }
        
        const country = row.country?.trim() || null;
        const methodology = row.methodology?.trim() || null;

        // Parse levels if provided
        let levelIds = null; // null means don't update levels, [] means clear levels
        if (row.levels !== undefined && row.levels !== null) {
          const levelsValue = row.levels.toString().trim();
          if (levelsValue === '') {
            // Empty string means clear all levels
            levelIds = [];
          } else {
            // Parse level names
            const levelNames = levelsValue.split(',').map((name) => name.trim()).filter(name => name);
            levelIds = allLevels
              .filter((l) => levelNames.some((name) => l.name.toLowerCase() === name.toLowerCase()))
              .map((l) => l.id);
            
            // Check if any levels were not found
            const foundLevelNames = allLevels
              .filter((l) => levelNames.some((name) => l.name.toLowerCase() === name.toLowerCase()))
              .map((l) => l.name);
            const notFoundLevels = levelNames.filter(
              (name) => !foundLevelNames.some((found) => found.toLowerCase() === name.toLowerCase())
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

        // Check if CurricularObjective already exists (by name, country, and methodology)
        const existing = await prisma.curricularObjectives.findFirst({
          where: {
            name: name,
            country: country,
            methodology: methodology,
          },
        });

        if (existing) {
          // Update existing CurricularObjective
          const updateData = {
            name: name,
            country: country,
            methodology: methodology,
          };
          
          // Only update levels if they were provided in the Excel
          if (levelIds !== null) {
            updateData.Levels = {
              set: levelIds.map((id) => ({ id })),
            };
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

