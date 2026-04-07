import prisma from './prisma';
import moment from 'moment-timezone';
import { updateObjective } from './objective';

export const createEvaluation = async (data) => {
  const {
    studentId,
    objectiveId,
    oldLevelOfAchievementId,
    levelOfAchievementId,
    classroomId,
    institutionId,
    teacherId,
    date,
  } = data;

  // When a calendar date is sent (e.g. planned activity / report period), anchor to that UTC day
  // so createdAt stays inside the same [startDate, endDate] window used when loading objectives
  // (see getObjectivesWithAdvancementByIds). The old isBefore(now, 'day') branch used "now" for
  // same-day evaluations, which could land on the next UTC day and be excluded from the fetch.
  let createdAt;
  let createdAtDayRange;
  if (date) {
    const utcStart = moment.utc(date).startOf('day');
    const utcEnd = moment.utc(date).endOf('day');
    createdAt = utcStart.toDate();
    createdAtDayRange = {
      gte: utcStart.toDate(),
      lte: utcEnd.toDate(),
    };
  } else {
    createdAt = new Date();
    createdAtDayRange = {
      gte: moment(createdAt).startOf('day').toDate(),
      lte: moment(createdAt).endOf('day').toDate(),
    };
  }

  const existing = await prisma.evaluations.findFirst({
    where: {
      objectiveId,
      studentId,
      createdAt: createdAtDayRange,
    },
  });

  if (existing) {
    const updated = await prisma.evaluations.update({
      where: { id: existing.id },
          data: {
        oldLevelOfAchievementId,
        levelOfAchievementId,
        updatedById: teacherId,
      },
      include: {
        Objectives: {
          include: { Cores: true },
        },
        Students: true,
        Classes: true,
        Levels: true,
        Institutions: true,
        Cores: true,
        LevelsOfAchievement_Evaluations_oldLevelOfAchievementIdToLevelsOfAchievement: true,
        LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
      },
    });

    return JSON.parse(JSON.stringify(updated));
  }

  // Get classroom and objective to extract level and core
  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    include: { Levels: true },
  });

  // Use findUnique since id is unique, then check deletedAt separately
  const objective = await prisma.objectives.findUnique({
    where: { id: objectiveId },
    include: { 
      Cores: true,
      Classes: {
        where: { id: classroomId },
        select: { id: true },
      },
    },
  });

  if (!classroom) {
    throw new Error(`Classroom not found: ${classroomId}`);
  }
  
  if (!objective) {
    throw new Error(`Objective not found: ${objectiveId}`);
  }
  
  if (objective.deletedAt) {
    throw new Error(`Objective is deleted: ${objectiveId}`);
  }
  
  if (!objective.Classes || objective.Classes.length === 0) {
    if (classroom.institutionId !== institutionId) {
      throw new Error(`Classroom ${classroomId} does not belong to institution ${institutionId}`);
    }
    await updateObjective(objectiveId, { newClassroom: classroomId });
  }

  const evaluation = await prisma.evaluations.create({
    data: {
      objectiveId,
      studentId,
      teacherId,
      classroomId,
      levelId: classroom.levelId,
      institutionId,
      coreId: objective.coreId,
      oldLevelOfAchievementId,
      levelOfAchievementId,
      createdAt,
    },
    include: {
      Objectives: {
        include: { Cores: true },
      },
      Students: true,
      Classes: true,
      Levels: true,
      Institutions: true,
      Cores: true,
      LevelsOfAchievement_Evaluations_oldLevelOfAchievementIdToLevelsOfAchievement: true,
      LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
              },
  });

  return JSON.parse(JSON.stringify(evaluation));
}

export const getEvaluationsByInstitution = async (institutionId) => {
  const evaluations = await prisma.evaluations.findMany({
    where: {
      institutionId,
      Objectives: {
        deletedAt: null,
      },
      Students: {
        deactivatedAt: null,
        deletedAt: null,
      },
    },
    include: {
      Objectives: {
        include: { Cores: true },
      },
      Students: true,
      Classes: true,
      LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
    },
    take: 100000,
  });

  // Transform to lowercase for backward compatibility
  const transformed = evaluations.map((evaluation) => ({
    ...evaluation,
    objective: evaluation.Objectives,
    student: evaluation.Students,
    classroom: evaluation.Classes,
    levelOfAchievement: evaluation.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement,
    core: evaluation.Objectives?.Cores,
    class: evaluation.Classes,
    objectiveId: evaluation.objectiveId,
    studentId: evaluation.studentId,
  }));

  return JSON.parse(JSON.stringify(transformed));
}

export const getEvaluationsByStudentAndCore = async (
  studentId,
  coreId,
  startDate = moment().startOf('year').format('YYYY-MM-DD'),
  endDate = moment().add(1, 'day').format('YYYY-MM-DD'),
) => {
  const evaluations = await prisma.evaluations.findMany({
    where: {
      studentId,
      Objectives: {
        coreId,
        deletedAt: null,
      },
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      Objectives: true,
      LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement: true,
    },
    take: 100000,
  });

  // Transform to lowercase for backward compatibility
  const transformed = evaluations.map((evaluation) => ({
    ...evaluation,
    objective: evaluation.Objectives,
    levelOfAchievement: evaluation.LevelsOfAchievement_Evaluations_levelOfAchievementIdToLevelsOfAchievement,
  }));

  return JSON.parse(JSON.stringify(transformed));
}
