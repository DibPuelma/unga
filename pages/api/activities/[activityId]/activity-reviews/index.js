import { getActivity } from "db/activity";
import { createActivityReview, getReviewsByActivity } from "db/activityReview";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export default async (req, res) => {
  const { user, user: { institution } } = await getServerSession(req, res, authOptions);
  if (!user) {
    return res.status(401).end();
  }
  const { query: { activityId } } = req;
  const activity = await getActivity(activityId);
  if (activity.sponsorInstitutionId !== institution.id
    && !activity.publiclyAvailable && !activity.openToCommunity
  ) {
    return res.status(403).end();
  }

  if (req.method === 'GET') {
    const response = await getReviewsByActivity(activityId);
    res.status(200).json(response);
  }

  if (req.method === 'POST') {
    const response = await createActivityReview({ activityId, userId: user.id, ...req.body });
    res.status(200).json(response);
  }
};