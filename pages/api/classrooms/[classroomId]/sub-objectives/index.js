import { getSubObjectivesWithAdvancement } from "db/subObjectives";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';

export default async (req, res) => {
  const { user: { classrooms, institution } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, ids, endDate, startDate } } = req;
  if (!classrooms.includes(classroomId)) {
    return res.status(403).end();
  }
  if (req.method == 'GET') {
    res.setHeader('Cache-Control', 'private, no-store');
    if (!ids) return res.status(400).json({ message: 'Esta actividad no tiene indicadores para evaluar' });
    const query = await getSubObjectivesWithAdvancement({
      ids: ids.split(','),
      classroomId,
      institutionId: institution.id,
      ...(startDate && { startDate }),
      endDate,
    });
    res.status(200).json(serializeForAPI(query));
  }
};