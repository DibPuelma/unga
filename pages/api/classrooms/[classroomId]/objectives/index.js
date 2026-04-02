import { getCores } from "db/core";
import { createObjectiveForClassrooms, getObjectivesByCoresClassroom, getObjectivesWithAdvancementByIds } from "db/objective";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { serializeForAPI } from 'src/helpers/businessLogic';
import { classroomAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const { user, user: { institution } } = await getServerSession(req, res, authOptions);
  const { query: { classroomId, ids, coresNames, endDate, startDate } } = req;

  const authorized = await classroomAuthorization(user, classroomId);
  if (!authorized) {
    return res.status(403).end();
  }

  if (req.method == 'POST') {
    const response = await createObjectiveForClassrooms({ user, classrooms: [classroomId], ...req.body });
    res.status(200).json(serializeForAPI(response));
  }

  if (req.method == 'GET') {
    res.setHeader('Cache-Control', 'private, no-store');
    let query = null;
    if (ids) query = await getObjectivesWithAdvancementByIds({
      ids: ids.split(','),
      classroomId,
      institutionId: institution.id,
      ...(startDate && { startDate }),
      endDate,
    });
    else if (coresNames) {
      const institutionCores = await getCores(institution.id);
      const queriedCoresIds = coresNames.split(',').map(
        (core) => institutionCores.find((institutionCore) => institutionCore.name === core)?.id
      ).filter(Boolean); // Remove undefined values
      if (queriedCoresIds.length > 0) {
        query = await getObjectivesByCoresClassroom(queriedCoresIds, classroomId)
      } else {
        query = [];
      }
    }
    res.status(200).json(serializeForAPI(query || []));
  }
};