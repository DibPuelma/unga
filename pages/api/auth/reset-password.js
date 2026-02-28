import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { resetPassword } from "db/auth";

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);
  if (!user) return res.status(403);
  if (req.method == 'PATCH') {
    try {
      await resetPassword(user.id, req.body.newPassword);
      res.status(200).end();
    } catch (e) {
      res.status(400).end();
    }
  }
};