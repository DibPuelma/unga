// Utility functions for Prisma
// Prisma returns data directly - no wrapping needed

// Helper to convert ID to Prisma relation connect format
export const refMapper = (modelName) => (item) => {
  if (typeof item === 'string') {
    return { connect: { id: item } };
  }
  return { connect: { id: item.id || item } };
}
