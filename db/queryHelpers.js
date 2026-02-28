import prisma from './prisma';

export const getQueryHelpers = () => {
  // These were FaunaDB-specific helpers, now using Prisma directly
  return {
    getIfPathExists: (path, object) => {
      // Prisma handles null checks directly
      return object?.[path] || null;
    },
    selectIfPathExists: (path, object) => {
      return object?.[path] || null;
    },
  };
}

export const getIfPathExists = (path, object) => {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = object;
  for (const key of keys) {
    if (current == null) return null;
    current = current[key];
  }
  return current || null;
}

export const selectIfPathExists = (path, object) => {
  return getIfPathExists(path, object);
}
