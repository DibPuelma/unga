import { getServerSession } from 'next-auth/next';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { createInstitution } from 'db/institution';
import { createClassroom } from 'db/class';
import { getLevels } from 'db/level';
import { getUserData, updateUser } from 'db/user';

// One-shot B2C provisioning: personal institution + one classroom per level.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const sessionUser = session?.user;
  const { userId } = req.query;

  if (!sessionUser?.id) return res.status(401).end();
  if (sessionUser.id !== userId) return res.status(403).end();

  const { levelIds } = req.body || {};
  if (!Array.isArray(levelIds) || levelIds.length === 0) {
    return res.status(400).json({ message: 'levelIds is required' });
  }

  const user = await getUserData(userId);
  if (user.institutionId || user.institution?.id) {
    return res.status(409).json({ message: 'already_provisioned' });
  }

  const allLevels = await getLevels();
  const selectedLevels = allLevels.filter((level) => levelIds.includes(level.id));
  if (selectedLevels.length === 0) {
    return res.status(400).json({ message: 'invalid_levels' });
  }

  const institution = await createInstitution({
    name: `Espacio de ${user.firstName?.split(' ')[0] || 'educadora'}`,
    country: user.country || 'Chile',
  });

  const classrooms = [];
  for (const level of selectedLevels) {
    const classroom = await createClassroom({
      name: level.name,
      level: level.id,
      institution: institution.id,
      mainTeacher: userId,
    });
    classrooms.push(classroom);
  }

  await updateUser(userId, {
    institution: institution.id,
    classrooms: classrooms.map((c) => c.id),
  });

  return res.status(200).json({
    institution,
    classrooms,
  });
}
