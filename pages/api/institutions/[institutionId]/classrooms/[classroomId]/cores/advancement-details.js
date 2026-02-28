import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from 'pages/api/auth/authorizations';
import AdvancementCalculationService from 'services/AdvancementCalculationService';

export default async (req, res) => {
  const { user } = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    const { query: { classroomId, institutionId, startDate } } = req;
    const authorized = await classroomAuthorization(user, classroomId);
    if (!authorized) return res.status(403).end();

    const advancementDetails = await AdvancementCalculationService.getCoresWithMonthlyAdvancement(institutionId, classroomId, startDate);
    res.status(200).json(advancementDetails);
  }
};