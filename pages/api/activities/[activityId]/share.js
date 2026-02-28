import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { openActivityToCommunity, getActivity } from "db/activity";
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { id: userId } } = await getServerSession(req, res, authOptions);
  if (req.method == 'PATCH') {
    const { query: { activityId } } = req;
    const activity = await getActivity(activityId);
    if (userId !== activity.creatorId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    try {
      const query = await openActivityToCommunity(activityId)
      return res.status(200).json(serializeForAPI({ ...query }));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ...error });
    }
  }
};