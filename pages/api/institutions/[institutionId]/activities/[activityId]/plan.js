import { planActivity } from "db/plannedActivity";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization, institutionAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const { user } = session;
  const { id: userId } = user;
  
  if (req.method == 'POST') {
    const { query: { institutionId, activityId } } = req;
    const { body: { classroom } } = req;
    
    // Check institution authorization
    const institutionAuthorized = await institutionAuthorization(user, institutionId);
    if (!institutionAuthorized) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check classroom authorization
    const classroomAuthorized = await classroomAuthorization(user, classroom);
    if (!classroomAuthorized) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    try {
      const query = await planActivity({
        ...req.body,
        teacher: userId,
        activity: activityId,
        institution: institutionId,
      })
      return res.status(200).json({ ...query });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ...error });
    }
  }
};