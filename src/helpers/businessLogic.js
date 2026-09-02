import { toAcronym } from "./strings";
import _ from "lodash";
import moment from "moment-timezone";
import { ascendingSort } from "./arrays";

export const SCOPES_FOR_CORE = {
  'Identidad y autonomía': 'Desarrollo Personal y Social',
  'Convivencia y ciudadanía': 'Desarrollo Personal y Social',
  'Corporalidad y movimiento': 'Desarrollo Personal y Social',
  'Lenguaje verbal': 'Comunicación Integral',
  'Lenguajes artísticos': 'Comunicación Integral',
  'Inglés': 'Comunicación Integral',
  'Exploración del entorno natural': 'Interacción y Comprensión del Entorno',
  'Comprensión del entorno sociocultural': 'Interacción y Comprensión del Entorno',
  'Pensamiento matemático': 'Interacción y Comprensión del Entorno',
  // Highscope
  'Acercamiento al aprendizaje': 'Acercamiento al aprendizaje',
  'Desarrollo social y emocional': 'Desarrollo social y emocional',
  'Lenguaje y comunicación': 'Lenguaje y comunicación',
  'Matemáticas': 'Matemáticas',
  'Artes creativas': 'Artes creativas',
  'Ciencia y tecnología': 'Ciencia y tecnología',
  'Estudios sociales': 'Estudios sociales',
  'Desarrollo físico y salud': 'Desarrollo físico y salud',
  'Desarrollo cognitivo': 'Desarrollo cognitivo',
};

export const getScopesObjectWithStrings = (methodology) => {
  if (!methodology) {
    return {
      'Desarrollo Personal y Social': '',
      'Comunicación Integral': '',
      'Interacción y Comprensión del Entorno': '',
    }
  } else if (methodology === 'highScope') {
    return {
      'Acercamiento al aprendizaje': '',
      'Desarrollo social y emocional': '',
      'Lenguaje y comunicación': '',
      'Matemáticas': '',
      'Artes creativas': '',
      'Ciencia y tecnología': '',
      'Estudios sociales': '',
      'Desarrollo físico y salud': '',
      'Desarrollo cognitivo': '',
    }
  }
}

export const getCoresByScope = (cores, methodology) => {
  let coresByScopes = {};
  if (!methodology) {
    coresByScopes = {
      'Desarrollo Personal y Social': [],
      'Comunicación Integral': [],
      'Interacción y Comprensión del Entorno': [],
    };
  } else if (methodology === 'highScope') {
    coresByScopes = {
      'Acercamiento al aprendizaje': [],
      'Desarrollo social y emocional': [],
      'Lenguaje y comunicación': [],
      'Matemáticas': [],
      'Artes creativas': [],
      'Ciencia y tecnología': [],
      'Estudios sociales': [],
      'Desarrollo físico y salud': [],
      'Desarrollo cognitivo': [],

    };
  }

  ascendingSort(cores, 'position').forEach((core) => {
    coresByScopes[SCOPES_FOR_CORE[core.name]].push(core);
  })

  return coresByScopes;
}

export const getViewAccessClassrooms = (user, allClassrooms) => {
  if (user.role === 'principal') return allClassrooms;

  return getEditAccessClassrooms(user, allClassrooms);
}

export const getEditAccessClassrooms = (user, allClassrooms) => {
  if (user.role === 'principal' || user.role === 'coordinator') {
    return allClassrooms;
  }

  let allowedClassroomsIds = user.classrooms;
  if (!allowedClassroomsIds) return [];
  return allClassrooms.filter(
    (classroom) => allowedClassroomsIds.includes(classroom.id)
  );
}

export const outsideApp = (user) => !user || user.deletedAt

export const noClassroom = (user) => !user.classrooms || user.classrooms.length === 0;

export const noInstitution = (user) => !user || !user.institution

export const cleanDateToSendToDB = (date) => {
  if (!date) return null;
  if (date.format) return date.format('YYYY-MM-DD');
  // Prisma expects Date objects or ISO strings
  if (date instanceof Date) return moment.utc(date).format('YYYY-MM-DD');
  if (typeof date === 'string') return date;

  return null;
}

export const cleanDateForFrontend = (date) => {
  if (!date) return null;
  if (date.format) return date;
  // Prisma returns Date objects or ISO strings
  if (date instanceof Date) return moment.utc(date);
  if (typeof date === 'string') return moment.utc(date);

  return null;
}

/**
 * Recursively converts Date objects to ISO strings for JSON serialization
 * Handles nested objects, arrays, and Proxy objects
 * @param {any} obj - The value to convert
 * @returns {any} - Converted value with Date objects as ISO strings
 */
const convertDatesToISO = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  // Convert Date objects to ISO strings
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertDatesToISO(item));
  }
  
  // Handle objects (including Proxy objects)
  if (typeof obj === 'object') {
    try {
      const plain = {};
      const keys = Object.keys(obj);
      for (const key of keys) {
        plain[key] = convertDatesToISO(obj[key]);
      }
      return plain;
    } catch (e) {
      // If Object.keys() fails (e.g., for some Proxy objects), try JSON.stringify/parse
      try {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }));
      } catch (e2) {
        // If all else fails, return as-is
        return obj;
      }
    }
  }
  
  // Primitive types pass through
  return obj;
};

/**
 * Serializes data for Next.js getServerSideProps/getStaticProps
 * Converts Date objects to ISO strings so they can be serialized as JSON
 * Handles Proxy objects (like DefaultDict) by converting them to plain objects
 * @param {any} data - The data to serialize
 * @returns {any} - Serialized data with Date objects converted to strings
 */
export const serializeForNextProps = (data) => {
  const converted = convertDatesToISO(data);
  // Use JSON.parse(JSON.stringify()) to ensure complete serialization
  return JSON.parse(JSON.stringify(converted));
}

/**
 * Serializes data for API endpoint responses
 * Converts Date objects to ISO strings so they can be serialized as JSON
 * Handles Proxy objects (like DefaultDict) by converting them to plain objects
 * @param {any} data - The data to serialize
 * @returns {any} - Serialized data with Date objects converted to strings
 */
export const serializeForAPI = (data) => {
  const converted = convertDatesToISO(data);
  // Use JSON.parse(JSON.stringify()) to ensure complete serialization
  return JSON.parse(JSON.stringify(converted));
}

/**
 * Picks who signs a report when an institution has more than one user for the same role
 * (duplicated accounts for the same person are common), so the choice never depends on the
 * order Postgres happens to return.
 * @param {Array} candidates - Users with the role, e.g. getInstitutionPrincipals() result
 * @param {Object} currentUser - The user viewing the report
 * @returns {Object|null} - The signer, or null when there are no candidates
 */
export const pickSigner = (candidates, currentUser) => {
  if (!candidates?.length) return null;
  return candidates.find((candidate) => candidate.id === currentUser?.id)
    || candidates.find((candidate) => candidate.signature)
    || candidates[0];
}

export const getClassroomsIdsByLevelId = (user, institution) => {
  if (!user || !institution || !institution.classrooms) return {};

  const classroomsIdsByLevelId = {};

  institution.classrooms.forEach((classroom) => {
    if (!classroomsIdsByLevelId[classroom.level.id]) {
      classroomsIdsByLevelId[classroom.level.id] = [];
    }
    classroomsIdsByLevelId[classroom.level.id].push(classroom.id);
  });

  return classroomsIdsByLevelId;
}

export const getLevelOfAchievementValueColor = (value, totalValues) => {
  if (value === 0) return '#a5a5a5';

  const greenness = parseInt((255 / totalValues) * value, 10);
  return `rgb(${64 - Math.ceil(greenness / 4)}, ${greenness}, 50)`
}