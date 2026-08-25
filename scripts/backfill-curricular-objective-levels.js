/**
 * Backfills CurricularObjectives (OA) levels from their child Objectives (indicadores) levels.
 *
 * An Objective can be tagged for a level (e.g. "Sala Cuna Mayor") without its linked
 * CurricularObjective ("OA relacionado") being tagged for that same level. Since the planning UI
 * only offers an indicator once its OA is selectable for the activity's level, this gap makes the
 * indicator silently unreachable even though it's correctly configured on its own.
 *
 * This script connects, for every Objective with a curricularObjectiveId, that Objective's levels
 * to its parent CurricularObjective's levels (union, never disconnects existing OA levels — an OA
 * can be shared by multiple indicators).
 *
 * Usage:
 *   node scripts/backfill-curricular-objective-levels.js            # dry run, reports only
 *   node scripts/backfill-curricular-objective-levels.js --apply    # applies the changes
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  const objectives = await prisma.objectives.findMany({
    where: { curricularObjectiveId: { not: null }, deletedAt: null },
    select: {
      id: true,
      name: true,
      curricularObjectiveId: true,
      ObjectiveLevels: { select: { levelId: true } },
      Cores: { select: { Institutions: { select: { name: true } } } },
    },
  });

  const curricularObjectiveIds = [...new Set(objectives.map((o) => o.curricularObjectiveId))];
  const curricularObjectives = await prisma.curricularObjectives.findMany({
    where: { id: { in: curricularObjectiveIds } },
    select: { id: true, Levels: { select: { id: true } } },
  });
  const currentLevelsByOA = new Map(
    curricularObjectives.map((co) => [co.id, new Set(co.Levels.map((l) => l.id))])
  );

  const missingByInstitution = new Map();
  const toConnect = new Map(); // curricularObjectiveId -> Set(levelId)

  for (const objective of objectives) {
    const oaLevels = currentLevelsByOA.get(objective.curricularObjectiveId) || new Set();
    const missingLevelIds = objective.ObjectiveLevels
      .map((ol) => ol.levelId)
      .filter((levelId) => !oaLevels.has(levelId));

    if (missingLevelIds.length === 0) continue;

    const institutionName = objective.Cores?.Institutions?.name || 'desconocida';
    missingByInstitution.set(institutionName, (missingByInstitution.get(institutionName) || 0) + 1);

    if (!toConnect.has(objective.curricularObjectiveId)) {
      toConnect.set(objective.curricularObjectiveId, new Set());
    }
    missingLevelIds.forEach((id) => toConnect.get(objective.curricularObjectiveId).add(id));
  }

  console.log('Indicadores con al menos un nivel no cubierto por su OA relacionado:');
  for (const [institutionName, count] of missingByInstitution) {
    console.log(`  ${institutionName}: ${count}`);
  }
  console.log(`Total OA a actualizar: ${toConnect.size}`);

  if (!APPLY) {
    console.log('\nDry run — no se aplicó ningún cambio. Volver a correr con --apply para aplicar.');
    return;
  }

  for (const [curricularObjectiveId, levelIds] of toConnect) {
    await prisma.curricularObjectives.update({
      where: { id: curricularObjectiveId },
      data: {
        Levels: { connect: [...levelIds].map((id) => ({ id })) },
      },
    });
  }
  console.log(`\nSe actualizaron ${toConnect.size} OA.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
