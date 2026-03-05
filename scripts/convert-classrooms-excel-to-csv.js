#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DEFAULT_TEACHER_PASSWORD = 'Unga2026!';
const TEACHER_EMAIL_DOMAIN = 'ungapp.com';

function usage() {
  console.log('Usage: node scripts/convert-classrooms-excel-to-csv.js "<input.xlsx>" [outputDir]');
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

function slugify(value) {
  return normalizeKey(value).replace(/[^a-z0-9]/g, '');
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
    const line = headers.map((header) => toCsvValue(row[header])).join(',');
    lines.push(line);
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function formatDateYYYYMMDD(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseBirthDate(value) {
  if (value == null || value === '') return '';

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return formatDateYYYYMMDD(date);
    }
  }

  const normalized = normalizeSpaces(value);
  if (!normalized) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return formatDateYYYYMMDD(parsedDate);
}

function splitTeacherName(fullName) {
  const words = normalizeSpaces(fullName).split(' ').filter(Boolean);
  if (words.length === 0) return { firstName: '', lastName: '' };
  if (words.length === 1) return { firstName: words[0], lastName: '' };
  return { firstName: words[0], lastName: words.slice(1).join(' ') };
}

function splitStudentName(fullName) {
  const words = normalizeSpaces(fullName).split(' ').filter(Boolean);
  if (words.length === 0) return { firstName: '', lastName: '' };
  if (words.length === 1) return { firstName: words[0], lastName: '' };
  if (words.length === 2) return { firstName: words[1], lastName: words[0] };
  return {
    lastName: `${words[0]} ${words[1]}`,
    firstName: words.slice(2).join(' '),
  };
}

function isPlaceholderTeacher(name) {
  const normalized = normalizeKey(name);
  if (!normalized) return true;
  if (normalized === 'nn') return true;
  if (normalized === 'educadora:' || normalized === 'educadora') return true;
  return false;
}

function extractLevelAndClassroomName(rawTitle) {
  const title = normalizeSpaces(rawTitle);
  const upper = title.toUpperCase().replace(/\s+/g, ' ');
  const afterColon = upper.includes(':') ? upper.split(':').slice(1).join(':').trim() : upper;
  const withoutYear = normalizeSpaces(afterColon.replace(/\b20\d{2}\b/g, ' ').replace(/\b2026\b/g, ' '));

  const candidates = [
    { match: 'SALA CUNA MENOR', level: 'Sala Cuna Menor', classroomBase: 'Sala Cuna Menor' },
    { match: 'SALA CUNA MAYOR', level: 'Sala Cuna Mayor', classroomBase: 'Sala Cuna Mayor' },
    { match: 'MEDIO MENOR', level: 'Nivel Medio Menor', classroomBase: 'Medio Menor' },
    { match: 'MEDIO MAYOR', level: 'Nivel Medio Mayor', classroomBase: 'Medio Mayor' },
    { match: 'MEDIO MAY0R', level: 'Nivel Medio Mayor', classroomBase: 'Medio Mayor' },
  ];

  for (const candidate of candidates) {
    if (withoutYear.includes(candidate.match)) {
      const suffix = normalizeSpaces(withoutYear.replace(candidate.match, ''));
      const classroomName = suffix ? `${candidate.classroomBase} ${suffix}` : candidate.classroomBase;
      return { level: candidate.level, classroomName };
    }
  }

  const fallback = withoutYear
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');

  return { level: '', classroomName: fallback || title || 'Sin Nombre' };
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const columnB = normalizeKey(rows[i][1]);
    if (columnB === 'n°' || columnB === 'nº' || columnB === 'n') {
      return i;
    }
  }
  return -1;
}

function ensureUniqueEmail(baseLocalPart, usedEmails) {
  const sanitized = baseLocalPart || 'teacher';
  let email = `${sanitized}@${TEACHER_EMAIL_DOMAIN}`;
  let counter = 2;
  while (usedEmails.has(email)) {
    email = `${sanitized}${counter}@${TEACHER_EMAIL_DOMAIN}`;
    counter += 1;
  }
  usedEmails.add(email);
  return email;
}

function teacherEmailFromName(firstName, lastName, usedEmails) {
  const first = slugify(firstName.split(' ')[0] || '');
  const last = slugify(lastName.split(' ')[0] || '');
  const base = [first, last].filter(Boolean).join('.') || 'teacher';
  return ensureUniqueEmail(base, usedEmails);
}

function main() {
  const inputPath = process.argv[2];
  const outputDirArg = process.argv[3] || process.cwd();

  if (!inputPath) {
    usage();
    process.exit(1);
  }

  const resolvedInputPath = path.resolve(inputPath);
  const resolvedOutputDir = path.resolve(outputDirArg);

  if (!fs.existsSync(resolvedInputPath)) {
    console.error(`Input file not found: ${resolvedInputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(resolvedOutputDir)) {
    console.error(`Output directory not found: ${resolvedOutputDir}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(resolvedInputPath, { cellDates: false });

  const classroomsRows = [];
  const studentsRows = [];
  const teachersMap = new Map();
  const usedEmails = new Set();

  // Skip hidden sheets that may not be visible in Excel
  const sheetsToSkip = ['MMAA Actual', 'MMAB Actual ', 'MMAC Actual'];
  
  for (const sheetName of workbook.SheetNames) {
    if (sheetsToSkip.includes(sheetName)) continue;
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    const titleCell = rows[1] && rows[1][0] ? rows[1][0] : sheetName;
    const { level, classroomName } = extractLevelAndClassroomName(titleCell);

    const headerRowIndex = findHeaderRow(rows);
    if (headerRowIndex === -1) continue;

    const staffRows = rows.slice(2, headerRowIndex);
    const staffMembers = [];
    let mainTeacherEmail = '';

    for (const row of staffRows) {
      const rawName = normalizeSpaces(row[2]);
      const rawRole = normalizeSpaces(row[3]);
      if (!rawName || isPlaceholderTeacher(rawName)) continue;

      const role = rawRole || 'teacher';
      const key = normalizeKey(rawName);
      const { firstName, lastName } = splitTeacherName(rawName);

      if (!teachersMap.has(key)) {
        const email = teacherEmailFromName(firstName, lastName, usedEmails);
        teachersMap.set(key, {
          email,
          firstName,
          lastName,
          role: 'teacher',
          password: DEFAULT_TEACHER_PASSWORD,
          classrooms: new Set(),
        });
      }

      const teacher = teachersMap.get(key);
      teacher.classrooms.add(classroomName);
      staffMembers.push({ email: teacher.email, role: normalizeKey(role) });
    }

    const mainTeacher = staffMembers.find(
      (member) => member.role.includes('educadora') && !member.role.includes('flotante')
    );
    if (mainTeacher) {
      mainTeacherEmail = mainTeacher.email;
    }

    classroomsRows.push({
      name: classroomName,
      level,
      mainTeacherEmail,
      associateObjectives: 'true',
    });

    for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      const studentName = normalizeSpaces(row[2]);
      if (!studentName) continue;

      const { firstName, lastName } = splitStudentName(studentName);
      const rut = normalizeSpaces(row[3]);
      const birthDate = parseBirthDate(row[4]);

      studentsRows.push({
        firstName,
        lastName,
        rut,
        birthDate,
        classroomName,
      });
    }
  }

  const teachersRows = Array.from(teachersMap.values()).map((teacher) => ({
    email: teacher.email,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    role: teacher.role,
    phoneNumber: '',
    country: 'cl',
    password: teacher.password,
    classrooms: Array.from(teacher.classrooms).sort().join(', '),
  }));

  const classroomsPath = path.join(resolvedOutputDir, 'classrooms.csv');
  const teachersPath = path.join(resolvedOutputDir, 'teachers.csv');
  const studentsPath = path.join(resolvedOutputDir, 'students.csv');

  writeCsv(classroomsPath, ['name', 'level', 'mainTeacherEmail', 'associateObjectives'], classroomsRows);
  writeCsv(
    teachersPath,
    [
      'email',
      'firstName',
      'lastName',
      'role',
      'phoneNumber',
      'country',
      'password',
      'classrooms',
    ],
    teachersRows
  );
  writeCsv(
    studentsPath,
    ['firstName', 'lastName', 'rut', 'birthDate', 'classroomName'],
    studentsRows
  );

  console.log(`Processed sheets: ${workbook.SheetNames.length}`);
  console.log(`Classrooms rows: ${classroomsRows.length}`);
  console.log(`Teachers rows: ${teachersRows.length}`);
  console.log(`Students rows: ${studentsRows.length}`);
  console.log(`Created files:
- ${classroomsPath}
- ${teachersPath}
- ${studentsPath}`);
}

main();
