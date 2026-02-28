import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { cloneActivity, getActivity } from "db/activity";

export default async (req, res) => {
  const { user: { id: userId } } = await getServerSession(req, res, authOptions);
  if (req.method == 'POST') {
    const { query: { institutionId, activityId } } = req;
    const activity = await getActivity(activityId);
    if (activity.sponsorInstitutionId !== institutionId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    try {
      const query = await cloneActivity({
        institutionId,
        userId,
        id: activityId,
      })
      return res.status(200).json({ ...query });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ ...error });
    }
  }
};