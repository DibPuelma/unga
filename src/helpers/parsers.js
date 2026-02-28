export const idMapper = (object) => {
  // Prisma format - direct id access
  return object?.id || null;
}

export const nameMapper = ((item) => item.name);