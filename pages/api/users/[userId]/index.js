import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { updateUser, getUserData, softDeleteUser } from "db/user";
import { sendParentWelcomeEmail, sendTeacherWelcomeEmail } from 'services/email/users';
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { query: { userId }, body } = req;
  if (req.method === 'PATCH') {
    let query;
    const { user, user: { institution } } = await getServerSession(req, res, authOptions);
    if (user.id === userId || user.role === 'super-admin') {
      if (body.role) {
        if (body.role === 'teacher') sendTeacherWelcomeEmail(user);
        else if (body.role === 'parent') sendParentWelcomeEmail(user);
      }
      query = await updateUser(userId, body);
      return res.status(200).json(serializeForAPI(query));
    }

    const userToUpdate = await getUserData(userId);
    if (userToUpdate.institution.id === institution.id) {
      query = await updateUser(userId, body);
      return res.status(200).json(serializeForAPI(query));
    }

    return res.status(403).end();
  }

  if (req.method === 'DELETE') {
    try {
      const query = await softDeleteUser(userId)
      res.status(200).json(serializeForAPI(query));
    } catch (e) {
      console.error(e)
      res.status(400).json(e);
    }
  }
};