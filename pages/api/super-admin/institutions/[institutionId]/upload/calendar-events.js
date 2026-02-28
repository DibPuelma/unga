import { parseForm, parseXLSX, validateSuperAdmin } from './_utils';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import prisma from 'lib/prisma';
import { config } from './_utils';
import moment from 'moment-timezone';

export { config };

/**
 * Parse a date value from Excel, handling various formats
 * @param {any} value - Date value from Excel (could be Date, number, or string)
 * @returns {moment.Moment|null} Parsed moment object or null if invalid
 */
function parseDateValue(value) {
  if (!value && value !== 0) {
    return null;
  }

  // If it's already a Date object
  if (value instanceof Date) {
    return moment(value);
  }

  // If it's a number, it might be an Excel serial date
  // Excel serial dates: number of days since January 1, 1900
  // Excel incorrectly treats 1900 as a leap year, so we need to account for that
  if (typeof value === 'number') {
    const days = Math.floor(value);
    // Excel epoch is 1899-12-30 (or 1900-01-01 minus 1 day due to the leap year bug)
    // Excel date 1 = 1900-01-01, but Excel treats 1900 as leap year
    // So we use 1899-12-30 as the base and add the days
    const excelEpoch = moment('1899-12-30');
    const date = excelEpoch.add(days, 'days');
    if (date.isValid() && date.year() >= 1900 && date.year() <= 2100) {
      return date;
    }
  }

  // Try parsing as string
  const strValue = value.toString().trim();
  
  // Try common date formats
  const formats = [
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'MM-DD-YYYY',
    'YYYY/MM/DD',
    'DD.MM.YYYY',
    'MM.DD.YYYY',
  ];

  for (const format of formats) {
    const parsed = moment(strValue, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  // Try moment's automatic parsing as last resort
  const autoParsed = moment(strValue);
  if (autoParsed.isValid()) {
    return autoParsed;
  }

  return null;
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

    const results = {
      successful: [],
      failed: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.name || !row.name.toString().trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Nombre es requerido',
          });
          continue;
        }

        if (!row.startDay || !row.startDay.toString().trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Fecha de inicio (startDay) es requerida',
          });
          continue;
        }

        if (!row.endDay || !row.endDay.toString().trim()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'Fecha de fin (endDay) es requerida',
          });
          continue;
        }

        // Parse dates - try multiple formats
        const startDay = parseDateValue(row.startDay);
        const endDay = parseDateValue(row.endDay);

        if (!startDay || !startDay.isValid()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: `Fecha de inicio inválida: ${row.startDay}. No se pudo convertir a fecha válida`,
          });
          continue;
        }

        if (!endDay || !endDay.isValid()) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: `Fecha de fin inválida: ${row.endDay}. No se pudo convertir a fecha válida`,
          });
          continue;
        }

        if (endDay.isBefore(startDay)) {
          results.failed.push({
            row: rowNumber,
            name: row.name || '',
            error: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
          });
          continue;
        }

        // Parse boolean value for shouldShowInCalendar
        let shouldShowInCalendar = true;
        if (row.shouldShowInCalendar !== undefined && row.shouldShowInCalendar !== null) {
          const value = row.shouldShowInCalendar.toString().trim().toLowerCase();
          shouldShowInCalendar = value === 'true' || value === '1' || value === 'yes' || value === 'si';
        }

        // Parse boolean value for isHoliday
        let isHoliday = false;
        if (row.isHoliday !== undefined && row.isHoliday !== null) {
          const value = row.isHoliday.toString().trim().toLowerCase();
          isHoliday = value === 'true' || value === '1' || value === 'yes' || value === 'si';
        }

        // Create calendar event
        const event = await prisma.institutionCalendarEvents.create({
          data: {
            name: row.name.toString().trim(),
            startDay: startDay.toDate(),
            endDay: endDay.toDate(),
            shouldShowInCalendar,
            isHoliday,
            institutionId,
          },
        });

        results.successful.push({
          row: rowNumber,
          name: event.name,
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
    console.error('Error procesando archivo de eventos del calendario:', error);
    return res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
}

