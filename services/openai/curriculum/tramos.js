// Levels in the DB only carry a name (no age fields); the BCEP tramo is
// derived from that name. Centralized here so a rename breaks one place only.
export const TRAMO_LABELS = {
  salaCuna: 'Sala Cuna (0 a 2 años)',
  nivelMedio: 'Nivel Medio (2 a 4 años)',
  transicion: 'Nivel Transición (4 a 6 años)',
};

export const tramoFromLevelName = (levelName) => {
  if (!levelName) return null;
  if (levelName.includes('Sala Cuna')) return 'salaCuna';
  if (levelName.includes('Nivel Medio')) return 'nivelMedio';
  if (levelName.includes('Transición')) return 'transicion';
  return null;
};
