import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { cloneActivity, getActivity } from "db/activity";
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { institution, id: userId } } = await getServerSession(req, res, authOptions);
  if (req.method == 'POST') {
    const { query: { activityId } } = req;
    const activity = await getActivity(activityId);
    if (!activity.publiclyAvailable && !activity.openToCommunity) return res.status(403).json({ message: 'Forbidden' });

    try {
      const query = await cloneActivity({
        userId,
        institutionId: institution.id,
        id: activityId,
        fromPublicLibrary: true,
      })
      return res.status(200).json(serializeForAPI({ ...query }));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ...error });
    }
  }
};