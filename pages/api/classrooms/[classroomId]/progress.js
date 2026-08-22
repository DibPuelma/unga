import { getClassroomProgress, getPlannedActivitiesByObjective, getEvaluatedActivitiesByObjective, getPlannedActivitiesBySubObjective, getEvaluatedActivitiesBySubObjective } from 'db/activityProgress';
import { getYearToDateRange } from 'src/helpers/workdays';
import { getInstitutionCores } from 'db/institution';
import { getClassroom } from 'db/class';
import { getObjectivesByCoresClassroom } from 'db/objective';
import prisma from 'db/prisma';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { classroomAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user } = session;
  const { query: { classroomId, coreId, objectiveId } } = req;

  const authorized = await classroomAuthorization(user, classroomId);
  if (!authorized) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { startDate, endDate } = getYearToDateRange();

    // If coreId is provided, return objectives breakdown
    if (coreId && !objectiveId) {
      // Fetch all objectives for this core and classroom, plus activity counts
      const [allObjectives, planned, evaluated] = await Promise.all([
        getObjectivesByCoresClassroom([coreId], classroomId),
        getPlannedActivitiesByObjective(classroomId, coreId, startDate, endDate),
        getEvaluatedActivitiesByObjective(classroomId, coreId, startDate, endDate),
      ]);

      // Create maps for quick lookup of activity counts
      const plannedMap = new Map();
      planned.forEach((obj) => {
        plannedMap.set(obj.objectiveId, obj.plannedCount);
      });

      const evaluatedMap = new Map();
      evaluated.forEach((obj) => {
        evaluatedMap.set(obj.objectiveId, obj.evaluatedCount);
      });

      // Merge all objectives with their activity counts
      const objectives = allObjectives.map((objective) => ({
        objectiveId: objective.id,
        objectiveName: objective.name,
        position: objective.position,
        plannedCount: plannedMap.get(objective.id) || 0,
        evaluatedCount: evaluatedMap.get(objective.id) || 0,
      }));

      return res.status(200).json({
        objectives: objectives.sort((a, b) => (a.position || 0) - (b.position || 0)),
      });
    }

    // If objectiveId is provided, return sub-objectives breakdown
    if (objectiveId) {
      // Fetch all sub-objectives for this objective and classroom, plus activity counts
      const [allSubObjectives, planned, evaluated] = await Promise.all([
        prisma.subObjectives.findMany({
          where: {
            objectiveId: objectiveId,
            Classes: {
              some: { id: classroomId },
            },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            position: true,
          },
          orderBy: { position: 'asc' },
        }),
        getPlannedActivitiesBySubObjective(classroomId, objectiveId, startDate, endDate),
        getEvaluatedActivitiesBySubObjective(classroomId, objectiveId, startDate, endDate),
      ]);

      // Create maps for quick lookup of activity counts
      const plannedMap = new Map();
      planned.forEach((subObj) => {
        plannedMap.set(subObj.subObjectiveId, subObj.plannedCount);
      });

      const evaluatedMap = new Map();
      evaluated.forEach((subObj) => {
        evaluatedMap.set(subObj.subObjectiveId, subObj.evaluatedCount);
      });

      // Merge all sub-objectives with their activity counts
      const subObjectives = allSubObjectives.map((subObjective) => ({
        subObjectiveId: subObjective.id,
        subObjectiveName: subObjective.name,
        position: subObjective.position,
        plannedCount: plannedMap.get(subObjective.id) || 0,
        evaluatedCount: evaluatedMap.get(subObjective.id) || 0,
      }));

      return res.status(200).json({
        subObjectives: subObjectives.sort((a, b) => (a.position || 0) - (b.position || 0)),
      });
    }

    // Default: return full progress summary
    const classroom = await getClassroom(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    const institutionCores = await getInstitutionCores(classroom.institutionId) || [];

    const progress = await getClassroomProgress(classroomId, institutionCores);
    return res.status(200).json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return res.status(500).json({ error: error.message });
  }
};

