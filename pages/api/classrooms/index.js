import { createClassroom } from "db/class";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { body } = req;
  if (req.method == 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).end();

    const { user } = session;
    const userInstitutionId = user.institution?.id || user.institutionId;
    const isSuperAdmin = user.role === 'superAdmin';
    const isPrincipalOfInstitution = user.role === 'principal' && userInstitutionId === body.institution;
    if (!isSuperAdmin && !isPrincipalOfInstitution) return res.status(403).end();

    const requiredParams = ['name', 'level', 'institution'];
    const missingParam = requiredParams.find((param) => !body[param]);
    if (missingParam) return res.status(400).json({ message: `Parameter ${missingParam} is required` });

    try {
      const query = await createClassroom(body)
      return res.status(200).json(query);
    } catch (e) {
      console.error(e)
      return res.status(400).json(e);
    }
  }
};