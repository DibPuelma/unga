import formidable from 'formidable';
import * as XLSX from 'xlsx';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
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
  // Lower is better: fewer mojibake and replacement chars.
  return countMojibakeMarkers(text) * 10 + countReplacementChars(text) * 100;
}

function fixPotentialMojibake(value) {
  if (value === null || value === undefined) return '';
  const original = value.toString();
  let best = original;
  let candidate = original;
  let bestScore = scoreTextQuality(original);

  // Some exports come double-encoded (e.g. "ÃƒÂ±"), so try a few repair passes.
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

function sanitizeHeaderKey(key) {
  const sanitized = fixPotentialMojibake(key);
  return sanitized.replace(/^\uFEFF/, '').trim();
}

function sanitizeCellValue(value) {
  if (typeof value !== 'string') return value;
  return fixPotentialMojibake(value);
}

export function parseXLSX(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    const data = rawData.map((row) => {
      const normalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[sanitizeHeaderKey(key)] = sanitizeCellValue(value);
      }
      return normalizedRow;
    });
    
    // Clean up temp file
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.warn('Error eliminando archivo temporal:', unlinkError);
    }
    
    return data;
  } catch (error) {
    // Clean up temp file even on error
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.warn('Error eliminando archivo temporal:', unlinkError);
    }
    throw error;
  }
}

export function validateSuperAdmin(session) {
  if (!session || session.user?.role !== 'superAdmin') {
    return false;
  }
  return true;
}

