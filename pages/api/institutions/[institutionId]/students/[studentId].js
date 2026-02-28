import { softDeleteStudent } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { query: { institutionId, studentId } } = req;
  const { user: { institution } } = await getServerSession(req, res, authOptions);

  if (institution.id !== institutionId) return res.status(403).end();

  if (req.method === 'DELETE') {
    try {
      const query = await softDeleteStudent(studentId);
      return res.status(200).json(query);
    } catch (e) {
      console.error(e);
      return res.status(400).end();
    }
  }
};