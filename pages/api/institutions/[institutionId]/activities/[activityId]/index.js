import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { getActivity, softDeleteActivity, updateActivity } from 'db/activity';

export default async (req, res) => {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).end();
    }
    const { user: { institution, id: userId, role } } = session;
    const { query: { institutionId, activityId } } = req;
    const activity = await getActivity(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    const activityCreatorId = activity.creatorId;
    if (req.method === 'PATCH') {
      if (institution.id !== institutionId) {
        return res.status(403).end();
      }
      try {
        const query = await updateActivity(activityId, { ...req.body, updatedBy: userId })
        res.status(200).json(query);
      } catch (error) {
        console.error('Error updating activity:', error);
        return res.status(500).json({ error: error.message || 'Failed to update activity' });
      }
    }
    
    if (req.method === 'DELETE') {
      if ((role !== 'principal' && role !== 'coordinator' && userId !== activityCreatorId) || institution.id !== institutionId) {
        return res.status(403).end();
      }
      try {
      const query = await softDeleteActivity(activityId);
      return res.status(200).json(query);
      } catch (error) {
        console.error('Error deleting activity:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete activity' });
      }
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};