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

export function parseXLSX(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
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




