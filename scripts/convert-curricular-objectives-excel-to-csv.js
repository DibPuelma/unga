#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function usage() {
  console.log(
    'Usage: node scripts/convert-curricular-objectives-excel-to-csv.js "<excel1.xlsx>" ["<excel2.xlsx>" ...] [--outDir "<outputDir>"]'
  );
}

function normalizeSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return normalizeSpaces(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function toCsvValue(value) {
  const text = value == null ? '' : String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(toCsvValue).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => toCsvValue(row[header])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function cleanText(value) {
  return normalizeSpaces(
    String(value || '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/^["']+|["']+$/g, '')
      .replace(/\s*["']\s*/g, ' ')
  );
}

function removeNumericPrefix(value) {
  const cleaned = cleanText(value);
  return cleaned
    .replace(/^\s*(?:OA\.?|OA)?\s*\d+\s*(?:[.,]\s*\d+)?\s*[:.)\-\/]?\s*/i, '')
    .trim();
}

function extractLeadingPosition(value) {
  const text = cleanText(value);
  const match = text.match(/^\s*(?:OA\.?|OA)?\s*(\d+)\s*(?:[.,]\s*(\d+))?/i);
  if (!match) return null;
  if (match[2]) return Number.parseInt(match[2], 10);
  return Number.parseInt(match[1], 10);
}

function mapLevelName(raw) {
  const key = normalizeKey(raw);
  if (!key) return '';

  if (key.includes('sala cuna menor') || key.includes('salacuna menor')) return 'Sala Cuna Menor';
  if (key.includes('sala cuna mayor') || key.includes('salacuna mayor')) return 'Sala Cuna Mayor';
  if (key.includes('medio menor') || key.includes('medi menor')) return 'Nivel Medio Menor';
  if (key.includes('medio mayor') || key.includes('medi mayor') || key.includes('medio may0r')) {
    return 'Nivel Medio Mayor';
  }
  if (key.includes('primer nivel transicion') || key.includes('nivel transicion i')) return 'Primer Nivel Transición';
  if (key.includes('segundo nivel transicion') || key.includes('nivel transicion ii')) return 'Segundo Nivel Transición';

  return '';
}

function splitFileArgs(argv) {
  const excelPaths = [];
  let outDir = process.cwd();

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (part === '--outDir') {
      outDir = argv[i + 1] ? path.resolve(argv[i + 1]) : outDir;
      i += 1;
      continue;
    }
    excelPaths.push(path.resolve(part));
  }

  return { excelPaths, outDir };
}

function findFirstCellContaining(rows, fragment) {
  const needle = normalizeKey(fragment);
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      if (normalizeKey(row[c]).includes(needle)) {
        return { rowIndex: r, colIndex: c, value: row[c] };
      }
    }
  }
  return null;
}

function extractCoreName(rows, sheetName) {
  // Format 1: row contains "NÚCLEO: ..."
  for (const row of rows) {
    for (const cell of row || []) {
      const text = String(cell || '');
      if (/n[úuù]cleo\s*:/i.test(text)) {
        const cleaned = cleanText(text.replace(/.*n[úuù]cleo\s*:/i, ''));
        return cleaned || '';
      }
    }
  }

  // Format 2: title line like "Corporalidad y Movimiento - Indicadores ..."
  for (const row of rows) {
    for (const cell of row || []) {
      const text = cleanText(cell);
      if (!text) continue;
      if (/indicadores/i.test(text) && /corporalidad/i.test(text)) {
        return cleanText(text.split('-')[0]);
      }
    }
  }

  // Fallback to sheet name cleanup
  return cleanText(sheetName.replace(/^n[úuù]cleo\s*/i, ''));
}

function extractSheetDefaultLevels(rows, sheetName) {
  // Prefer explicit NIVEL from format 1
  for (const row of rows) {
    for (const cell of row || []) {
      const text = String(cell || '');
      if (/nivel\s*:/i.test(text)) {
        const raw = cleanText(text.replace(/.*nivel\s*:/i, ''));
        const mapped = mapLevelName(raw);
        if (mapped) return [mapped];
      }
    }
  }

  // Format 2 from sheet name
  const sheetMapped = mapLevelName(sheetName);
  if (sheetMapped) return [sheetMapped];

  // "Niveles medios" contains both
  const key = normalizeKey(sheetName);
  if (key.includes('niveles medios')) {
    return ['Nivel Medio Menor', 'Nivel Medio Mayor'];
  }

  return [];
}

function parseFormat1Sheet(rows, context) {
  const { coreName, defaultLevels } = context;
  const parsed = [];

  const tableHeader = findFirstCellContaining(rows, 'objetivos de aprendizaje');
  // Some tabs (e.g., Comprensión del Entorno Sociocultural / Pensamiento Matemático)
  // start directly with OA rows and do not include the explicit table header.
  let startRow = tableHeader ? tableHeader.rowIndex + 1 : -1;
  if (startRow === -1) {
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r] || [];
      const colA = cleanText(row[0]);
      const colC = cleanText(row[2]);
      const looksLikeOA = /^\s*(?:OA\.?|OA)?\s*\d+[.,]?\d*/i.test(colA);
      if (looksLikeOA && colC) {
        startRow = r;
        break;
      }
    }
  }
  if (startRow === -1) return parsed;

  for (let r = startRow; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const curricularRaw = cleanText(row[0]);
    if (!curricularRaw) continue;

    const curricularName = removeNumericPrefix(curricularRaw);
    if (!curricularName) continue;

    const indicators = [cleanText(row[2]), cleanText(row[4])].filter(Boolean);
    if (indicators.length === 0) continue;

    for (const indicatorRaw of indicators) {
      const objectiveName = removeNumericPrefix(indicatorRaw);
      if (!objectiveName) continue;
      parsed.push({
        coreName,
        curricularObjectiveName: curricularName,
        objectiveName,
        levelNames: defaultLevels,
        position: extractLeadingPosition(indicatorRaw),
      });
    }
  }

  return parsed;
}

function parseFormat2Sheet(rows, context) {
  const { coreName, defaultLevels } = context;
  const parsed = [];

  const headerMatch = findFirstCellContaining(rows, 'objetivo de aprendizaje');
  if (!headerMatch) return parsed;

  const headerRowIndex = headerMatch.rowIndex;
  const headerRow = rows[headerRowIndex] || [];

  // Special case: if defaultLevels contains both Medio Menor and Medio Mayor
  // (e.g., from "Niveles medios" sheet), assign both levels to all objectives
  const isNivelesMedios = defaultLevels.length === 2 &&
    defaultLevels.includes('Nivel Medio Menor') &&
    defaultLevels.includes('Nivel Medio Mayor');

  // Build per-column level map from header cells where possible.
  const colLevelMap = {};
  for (let c = 1; c < headerRow.length; c += 1) {
    const mapped = mapLevelName(headerRow[c]);
    if (mapped) {
      colLevelMap[c] = mapped;
    }
  }

  // Fill blanks from nearest previous mapped column.
  let lastLevel = '';
  for (let c = 1; c < headerRow.length; c += 1) {
    if (colLevelMap[c]) {
      lastLevel = colLevelMap[c];
    } else if (lastLevel) {
      colLevelMap[c] = lastLevel;
    }
  }

  for (let r = headerRowIndex + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const curricularRaw = cleanText(row[0]);
    if (!curricularRaw) continue;

    const curricularObjectiveName = removeNumericPrefix(curricularRaw);
    if (!curricularObjectiveName) continue;

    for (let c = 1; c < row.length; c += 1) {
      const indicatorRaw = cleanText(row[c]);
      if (!indicatorRaw) continue;

      const objectiveName = removeNumericPrefix(indicatorRaw);
      if (!objectiveName) continue;

      // If this is "Niveles medios" sheet, always use both levels
      const levelNames = isNivelesMedios
        ? defaultLevels
        : colLevelMap[c]
          ? [colLevelMap[c]]
          : defaultLevels;

      parsed.push({
        coreName,
        curricularObjectiveName,
        objectiveName,
        levelNames,
        position: extractLeadingPosition(indicatorRaw),
      });
    }
  }

  return parsed;
}

function parseSheet(rows, sheetName) {
  const coreName = extractCoreName(rows, sheetName);
  const defaultLevels = extractSheetDefaultLevels(rows, sheetName);
  const hasBCePHeader = !!findFirstCellContaining(rows, 'Objetivos de aprendizaje B.C.E.P');
  const hasNucleoLabel = !!findFirstCellContaining(rows, 'NÚCLEO:');
  const isFormat1 = hasBCePHeader || hasNucleoLabel;

  const context = { coreName, defaultLevels };
  if (isFormat1) {
    return parseFormat1Sheet(rows, context);
  }
  return parseFormat2Sheet(rows, context);
}

function main() {
  const { excelPaths, outDir } = splitFileArgs(process.argv.slice(2));

  if (excelPaths.length === 0) {
    usage();
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) {
    console.error(`Output directory does not exist: ${outDir}`);
    process.exit(1);
  }

  for (const filePath of excelPaths) {
    if (!fs.existsSync(filePath)) {
      console.error(`Input file does not exist: ${filePath}`);
      process.exit(1);
    }
  }

  const curricularMap = new Map();
  const objectivesRows = [];

  for (const filePath of excelPaths) {
    const workbook = XLSX.readFile(filePath, { cellDates: false });
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rows || rows.length === 0) continue;

      const parsedRows = parseSheet(rows, sheetName);
      for (const item of parsedRows) {
        const curricularKey = `${normalizeKey(item.coreName)}||${normalizeKey(item.curricularObjectiveName)}`;
        if (!curricularMap.has(curricularKey)) {
          curricularMap.set(curricularKey, {
            name: item.curricularObjectiveName,
            coreName: item.coreName,
            country: 'cl',
            methodology: '',
            levels: new Set(),
          });
        }

        const curricular = curricularMap.get(curricularKey);
        for (const lvl of item.levelNames) {
          if (lvl) curricular.levels.add(lvl);
        }

        objectivesRows.push({
          name: item.objectiveName,
          coreName: item.coreName,
          curricularObjectiveName: item.curricularObjectiveName,
          levelNames: item.levelNames.filter(Boolean).join(', '),
          classroomNames: '',
          position: item.position || '',
        });
      }
    }
  }

  const curricularRows = Array.from(curricularMap.values()).map((row) => ({
    name: row.name,
    coreName: row.coreName,
    country: row.country,
    methodology: row.methodology,
    levels: Array.from(row.levels).sort().join(', '),
  }));

  const curricularPath = path.join(outDir, 'curricular-objectives.csv');
  const objectivesPath = path.join(outDir, 'objectives.csv');

  writeCsv(
    curricularPath,
    ['name', 'coreName', 'country', 'methodology', 'levels'],
    curricularRows
  );
  writeCsv(
    objectivesPath,
    ['name', 'coreName', 'curricularObjectiveName', 'levelNames', 'classroomNames', 'position'],
    objectivesRows
  );

  console.log(`Input files: ${excelPaths.length}`);
  console.log(`Curricular objectives rows: ${curricularRows.length}`);
  console.log(`Objectives rows: ${objectivesRows.length}`);
  console.log(`Created files:
- ${curricularPath}
- ${objectivesPath}`);
}

main();
