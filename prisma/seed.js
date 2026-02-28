const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Levels (only if they don't exist)
  const levelNames = [
    'Sala Cuna Menor',
    'Sala Cuna Mayor',
    'Nivel Medio Menor',
    'Nivel Medio Mayor',
    'Primer Nivel Transición',
    'Segundo Nivel Transición',
  ];

  const existingLevels = await prisma.levels.findMany({
    where: { name: { in: levelNames } },
    select: { name: true },
  });

  const existingNames = new Set(existingLevels.map((l) => l.name));
  const levelsToCreate = levelNames.filter((name) => !existingNames.has(name));

  if (levelsToCreate.length > 0) {
    await Promise.all(
      levelsToCreate.map((name) =>
        prisma.levels.create({ data: { name } })
      )
    );
    console.log(`Created ${levelsToCreate.length} new level(s)`);
  } else {
    console.log('All levels already exist');
  }

  console.log('Created cores and levels of achievement');

  // Create Users (using upsert to handle existing users)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.users.upsert({
    where: { email: 'esteban@ungapp.com' },
    update: {
      password: hashedPassword,
      firstName: 'Esteban',
      lastName: 'Admin',
      role: 'superAdmin',
      plan: 'institutional',
    },
    create: {
      email: 'esteban@ungapp.com',
      password: hashedPassword,
      firstName: 'Esteban',
      lastName: 'Admin',
      role: 'superAdmin',
      plan: 'institutional',
    },
  });

  console.log(`User ${superAdmin.email} created/updated successfully`);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

