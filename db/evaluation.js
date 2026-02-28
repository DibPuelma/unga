import prisma from './prisma';
import moment from 'moment-timezone';

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

  const now = moment();
  let createdAt = new Date();
  if (date) {
    const dateMoment = moment(date);
    if (dateMoment.isBefore(now, 'day')) {
      createdAt = dateMoment.toDate();
  }
  }

  // Check if evaluation already exists for this objective, student, and date
  const existing = await prisma.evaluations.findFirst({
    where: {
      objectiveId,
      studentId,
      createdAt: {
        gte: moment(createdAt).startOf('day').toDate(),
        lte: moment(createdAt).endOf('day').toDate(),
      },
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
  
  // Verify objective is associated with the classroom
  if (!objective.Classes || objective.Classes.length === 0) {
    throw new Error(`Objective ${objectiveId} is not associated with classroom ${classroomId}`);
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
