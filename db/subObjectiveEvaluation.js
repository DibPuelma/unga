import prisma from './prisma';
import moment from 'moment-timezone';

export const createSubObjectiveEvaluation = async (data) => {
  const {
    studentId,
    subObjectiveId,
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

  const subObjective = await prisma.subObjectives.findUnique({
    where: { id: subObjectiveId },
    include: {
      Cores: true,
      Objectives: true,
    },
  });

  if (!subObjective) throw new Error('SubObjective not found');

  const classroom = await prisma.classes.findUnique({
    where: { id: classroomId },
    include: { Levels: true },
  });

  if (!classroom) throw new Error('Classroom not found');

  const evaluation = await prisma.subObjectivesEvaluations.create({
    data: {
      subObjectiveId,
      studentId,
      teacherId,
      classroomId,
      levelId: classroom.levelId,
      institutionId,
      coreId: subObjective.coreId,
      objectiveId: subObjective.objectiveId,
      oldLevelOfAchievementId,
      levelOfAchievementId,
      createdAt,
    },
    include: {
      SubObjectives: {
        include: { Cores: true },
      },
      Students: true,
      Classes: true,
      Levels: true,
      Institutions: true,
      Cores: true,
      Objectives: true,
      LevelsOfAchievement_SubObjectivesEvaluations_oldLevelOfAchievementIdToLevelsOfAchievement: true,
      LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement: true,
    },
  });

  return JSON.parse(JSON.stringify(evaluation));
}

export const getSubObjectivesEvaluationsByInstitution = async (institutionId) => {
  const evaluations = await prisma.subObjectivesEvaluations.findMany({
    where: {
      institutionId,
      SubObjectives: {
        deletedAt: null,
      },
      Students: {
        deactivatedAt: null,
        deletedAt: null,
      },
    },
    include: {
      SubObjectives: {
        include: { Cores: true },
      },
      Students: true,
      Classes: true,
      LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement: true,
    },
    take: 100000,
  });

  return evaluations.map((evaluation) => ({
    ...evaluation,
    core: evaluation.SubObjectives.Cores,
    class: evaluation.Classes,
    levelOfAchievement: evaluation.LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement,
    subObjectiveId: evaluation.subObjectiveId,
    studentId: evaluation.studentId,
  }));
}

export const getSubObjectivesEvaluationsByStudentAndCore = async (
  studentId,
  coreId,
  startDate = moment().startOf('year').format('YYYY-MM-DD'),
  endDate = moment().add(1, 'day').format('YYYY-MM-DD'),
) => {
  const evaluations = await prisma.subObjectivesEvaluations.findMany({
    where: {
      studentId,
      SubObjectives: {
        coreId,
        deletedAt: null,
      },
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      SubObjectives: true,
      LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement: true,
    },
    take: 100000,
  });

  return evaluations.map((evaluation) => ({
    ...evaluation,
    subObjective: evaluation.SubObjectives,
    levelOfAchievement: evaluation.LevelsOfAchievement_SubObjectivesEvaluations_levelOfAchievementIdToLevelsOfAchievement,
  }));
}
