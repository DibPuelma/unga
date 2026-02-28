import { getStudentsForClassroom } from "db/student";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  const { query: { classroomId } } = req;
  
  const authorized = await classroomAuthorization(user, classroomId);
  if (!authorized) {
    return res.status(403).end();
  }
  if (req.method == 'GET') {
    const query = await getStudentsForClassroom(classroomId);
    res.status(200).json(query);
  }
};