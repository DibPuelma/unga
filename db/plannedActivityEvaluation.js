import prisma from './prisma';

export const createPlannedActivityEvaluation = async (data) => {
  const {
    studentId,
    objectiveId,
    subObjectiveId,
    oldLevelOfAchievementId,
    levelOfAchievementId,
    classroomId,
    institutionId,
    teacherId,
    activityId,
    plannedActivityId,
    activityPlannedDate,
  } = data;

  const objective = await prisma.objectives.findUnique({
    where: { id: objectiveId },
    include: { Cores: true },
  });

  if (!objective) throw new Error('Objective not found');

  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    include: { Levels: true },
  });

  if (!classroom) throw new Error('Classroom not found');

  const evaluation = await prisma.plannedActivitiesEvaluations.create({
    data: {
      activityId,
      plannedActivityId,
      activityPlannedDate: new Date(activityPlannedDate),
      objectiveId,
      subObjectiveId: subObjectiveId || null,
      studentId,
      teacherId,
      classroomId,
      levelId: classroom.levelId,
      institutionId,
      coreId: objective.coreId,
      oldLevelOfAchievementId,
      levelOfAchievementId,
    },
  });

  return JSON.parse(JSON.stringify(evaluation));
}
