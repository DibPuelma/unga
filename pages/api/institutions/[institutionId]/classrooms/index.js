import { createClassroom, getAllClassesByInstitution, getClassesByInstitution } from "db/class";
import { getNonHeterogeneousLevels } from "db/level";
import { getUserData } from "db/user";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { institutionAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { query: { institutionId }, body } = req;
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;

  if (req.method == 'GET') {
    if (!(await institutionAuthorization(user, institutionId))) return res.status(403);

    const query = await getAllClassesByInstitution(institutionId);
    res.status(200).json(query);
  }

  if (req.method === 'POST') {
    if (!user) return res.status(401).end();

    const userInstitutionId = user.institution?.id || user.institutionId;
    const isSuperAdmin = user.role === 'superAdmin';
    const isPrincipalOfInstitution = user.role === 'principal' && userInstitutionId === institutionId;
    if (!isSuperAdmin && !isPrincipalOfInstitution) return res.status(403).end();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const { levelId, mainTeacherId } = body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre de la sala es obligatorio' });
    }

    const validLevels = await getNonHeterogeneousLevels();
    if (!levelId || !validLevels.some((level) => level.id === levelId)) {
      return res.status(400).json({ message: 'Selecciona un nivel válido' });
    }

    const existingClassrooms = await getClassesByInstitution(institutionId);
    const nameTaken = existingClassrooms.some(
      (classroom) => classroom.name?.trim().toLowerCase() === name.toLowerCase()
    );
    if (nameTaken) {
      return res.status(409).json({ message: 'Ya existe una sala con este nombre en tu centro' });
    }

    if (mainTeacherId) {
      const teacher = await getUserData(mainTeacherId);
      const teacherInstitutionId = teacher?.institution?.id || teacher?.institutionId;
      const hasValidRole = teacher?.role === 'teacher' || teacher?.role === 'coordinator';
      if (!teacher || teacherInstitutionId !== institutionId || !hasValidRole) {
        return res.status(400).json({ message: 'La educadora seleccionada no pertenece a este centro' });
      }
    }

    try {
      const classroom = await createClassroom({
        name,
        level: levelId,
        institution: institutionId,
        mainTeacher: mainTeacherId || null,
      });
      return res.status(201).json(classroom);
    } catch (e) {
      console.error(e);
      return res.status(400).json({ message: 'No pudimos crear la sala' });
    }
  }
};