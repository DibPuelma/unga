import { getAllCoresWithAdvancement, getCore } from "db/core";
import { sortBy } from "lodash";
import moment from "moment-timezone";
import { enumerateMonthsBetweenDates } from "src/helpers/dates";
import { toAcronym } from "src/helpers/strings";

export default class AdvancementCalculationService {
  static getLevelOfAchievementFromAdvancement(advancement, levelsOfAchievement, calculated) {
    const maxLevelOfAchievement = Math.max(...levelsOfAchievement.map((loa) => loa.value));
    const totalLevels = levelsOfAchievement.length;
    let levelToAssign = null;
    for (let i = 0; i < totalLevels; i++) {
      const levelOfAchievement = levelsOfAchievement[i];
      if ((advancement - (100 / (maxLevelOfAchievement * 2))) * maxLevelOfAchievement / 100 <= levelOfAchievement.value) {
        return {
          ...levelsOfAchievement[i],
          calculated,
        };
      }
    }
    if (!levelToAssign) levelToAssign = levelsOfAchievement[totalLevels - 1];
    return {
      ...levelToAssign,
      calculated,
    };
  }

  static getStudentAdvancementInCoreFromObjectives({ objectives, levelsOfAchievement, hiddenObjectivesIds }) {
    const nonHiddenObjectives = objectives.filter(
      (objective) => !hiddenObjectivesIds.includes(objective.id)
    );
    const evaluatedObjectives = nonHiddenObjectives.filter(
      (objective) => objective.advancement > 0
    );
    const notEvaluatedObjectives = nonHiddenObjectives.filter(
      (objective) => objective.advancement === 0
    );

    const advancement = evaluatedObjectives.reduce(
      (prev, objective) => prev + objective.advancement, 0
    ) / (evaluatedObjectives.length || 1);

    const advancementLevelOfAchievement = this.getLevelOfAchievementFromAdvancement(advancement, levelsOfAchievement);
    const advancementText = advancementLevelOfAchievement.name;
    const advancementValue = advancementLevelOfAchievement.value;

    return {
      advancement,
      advancementText,
      advancementValue,
      advancementTextAcronym: toAcronym(advancementText),
      possibleEvaluations: nonHiddenObjectives.length,
      totalEvaluations: evaluatedObjectives.length,
      evaluatedObjectives: evaluatedObjectives.map((objective) => objective.id),
      notEvaluatedObjectives: notEvaluatedObjectives.map((objective) => objective.id),
    };
  }

  static addAdvancementDataToCoreByTimePeriod(core, levelsOfAchievement, hiddenObjectivesIds) {
    const reportTimePeriods = Object.keys(core.objectives);
    const advancementByTimePeriod = {};
    const newCore = { ...core };
    reportTimePeriods.forEach((timePeriod) => {
      const objectivesWithAdvancement = core.objectives[timePeriod].map(
        (objective) => this.addStudentAdvancementToObjective(objective, levelsOfAchievement)
      )
      newCore.objectives[timePeriod] = objectivesWithAdvancement;
      advancementByTimePeriod[timePeriod] = this.getStudentAdvancementInCoreFromObjectives({
        objectives: objectivesWithAdvancement,
        levelsOfAchievement,
        hiddenObjectivesIds,
      })
    })

    return {
      ...newCore,
      advancement: advancementByTimePeriod,
    }
  };

  static addStudentsAdvancementToCores(cores, levelsOfAchievement) {
    return cores.map((core) => this.addStudentsAdvancementToCore(core, levelsOfAchievement));
  }

  static addStudentsAdvancementToCore(core, levelsOfAchievement) {
    const calculatedObjectivesLOA = core.objectives.map(
      (objective) => this.addStudentsAdvancementToObjective(objective, levelsOfAchievement)
    );
    const possibleEvaluations = calculatedObjectivesLOA.reduce((acc, objective) => {
      return acc + objective.studentsLevelOfAchievement.length;
    }, 0);
    const totalEvaluations = calculatedObjectivesLOA.reduce((acc, objective) => {
      return acc + objective.studentsLevelOfAchievement.filter((studentLOA) => studentLOA.advancement > 0).length;
    }, 0);
    const totalObjectivesEvaluated = calculatedObjectivesLOA.filter((objective) => objective.advancement > 0).length;
    const advancement = calculatedObjectivesLOA.reduce((acc, objective) => {
      return acc + objective.advancement;
    }, 0) / (totalObjectivesEvaluated || 1);
    return {
      id: core.id,
      name: core.name,
      advancement,
      totalEvaluations,
      possibleEvaluations,
    }
  }

  static addStudentAdvancementToCore(core, levelsOfAchievement) {
    const calculatedObjectives = core.objectives.map(
      (objective) => this.addStudentAdvancementToObjective(objective, levelsOfAchievement)
    );
    const possibleEvaluations = calculatedObjectives.length;
    const totalEvaluations = calculatedObjectives.filter((objective) => objective.advancement > 0).length;
    const advancement = calculatedObjectives.reduce((acc, objective) => {
      return acc + objective.advancement;
    }, 0) / (totalEvaluations || 1);

    return {
      ...core,
      advancement,
      totalEvaluations,
      possibleEvaluations,
    }
  }

  static addStudentAdvancementToObjective(objective, levelsOfAchievement) {
    const maxLevelOfAchievement = Math.max(...levelsOfAchievement.map((loa) => loa.value));
    const objectiveAdvancement = objective.levelOfAchievement?.value 
      ? objective.levelOfAchievement.value / maxLevelOfAchievement * 100 
      : 0;
    const objectiveEvaluationDate = objective.evaluatedAt
      ? moment(objective.evaluatedAt)
      : moment('1970-01-01');
    let subObjectivesAdvancement = 0;
    let totalSubObjectivesEvaluated = 0;
    let lastSubObjectiveEvaluationDate = moment('1970-01-01');
    objective.subObjectives?.forEach((subObjective) => {
      const subObjectiveEvaluationDate = subObjective.evaluatedAt
        ? moment(subObjective.evaluatedAt)
        : moment('1970-01-01');
      if (subObjectiveEvaluationDate.isAfter(lastSubObjectiveEvaluationDate)) {
        lastSubObjectiveEvaluationDate = subObjectiveEvaluationDate;
      }
      if (subObjective.evaluatedAt && subObjective.levelOfAchievement?.value) {
        totalSubObjectivesEvaluated += 1
        subObjectivesAdvancement += subObjective.levelOfAchievement.value / maxLevelOfAchievement * 100;
      }
    }, 0)
    subObjectivesAdvancement /= (totalSubObjectivesEvaluated || 1);

    const [advancement, calculated] = this.getAdvancement({
      objectiveEvaluationDate,
      lastSubObjectiveEvaluationDate,
      objectiveAdvancement,
      subObjectivesAdvancement,
      calculated: objective.levelOfAchievement?.calculated ?? false,
    })

    return {
      ...objective,
      advancement,
      levelOfAchievement: this.getLevelOfAchievementFromAdvancement(advancement, levelsOfAchievement, calculated),
    }
  }

  static addStudentsAdvancementToObjective(objective, levelsOfAchievement) {
    const maxLevelOfAchievement = Math.max(...levelsOfAchievement.map((loa) => loa.value));
    const studentsLevelOfAchievement = objective.studentsLevelOfAchievement.map((sloa) => {
      const objectiveAdvancement = sloa.levelOfAchievement?.value 
        ? sloa.levelOfAchievement.value / maxLevelOfAchievement * 100 
        : 0;
      const objectiveEvaluationDate = sloa.evaluatedAt
        ? moment(sloa.evaluatedAt)
        : moment('1970-01-01');
      const [subObjectivesAdvancement, lastSubObjectiveEvaluationDate] = this.getSubObjectivesDataForStudent(
        objective,
        sloa.student.id,
        maxLevelOfAchievement,
      );
      const [advancement, calculated] = this.getAdvancement({
        objectiveEvaluationDate,
        lastSubObjectiveEvaluationDate,
        objectiveAdvancement,
        subObjectivesAdvancement,
        calculated: sloa.levelOfAchievement?.calculated ?? false,
      })

      return {
        ...sloa,
        levelOfAchievement: this.getLevelOfAchievementFromAdvancement(advancement, levelsOfAchievement, calculated),
        advancement,
      }
    });

    const totalEvaluations = studentsLevelOfAchievement.filter((sloa) => sloa.advancement > 0);
    const objectiveAdvancementSum = studentsLevelOfAchievement.reduce((acc, sloa) => {
      return acc + sloa.advancement;
    }, 0)
    const objectiveAdvancement = objectiveAdvancementSum / (totalEvaluations.length || 1);

    return {
      ...objective,
      studentsLevelOfAchievement,
      advancement: objectiveAdvancement,
    }
  }

  static getSubObjectivesDataForStudent(objective, studentId, maxLevelOfAchievement) {
    let subObjectivesAdvancement = 0;
    let totalSubObjectivesEvaluated = 0;
    let lastSubObjectiveEvaluationDate = moment('1970-01-01');
    if (!objective.subObjectives) return [subObjectivesAdvancement, lastSubObjectiveEvaluationDate];

    objective.subObjectives.forEach((subObjective) => {
      if (!subObjective.studentsLevelOfAchievement) return;
      const studentLOA = subObjective.studentsLevelOfAchievement.find(
        (subSloa) => subSloa.student.id === studentId
      )
      if (!studentLOA) return;
      const subObjectiveEvaluationDate = studentLOA.evaluatedAt
        ? moment(studentLOA.evaluatedAt)
        : moment('1970-01-01');
      if (subObjectiveEvaluationDate.isAfter(lastSubObjectiveEvaluationDate)) {
        lastSubObjectiveEvaluationDate = subObjectiveEvaluationDate;
      }
      if (studentLOA.evaluatedAt && studentLOA.levelOfAchievement?.value) {
        totalSubObjectivesEvaluated += 1
        subObjectivesAdvancement += studentLOA.levelOfAchievement.value / maxLevelOfAchievement * 100;
      }
    }, 0)
    subObjectivesAdvancement /= (totalSubObjectivesEvaluated || 1);

    return [subObjectivesAdvancement, lastSubObjectiveEvaluationDate];
  }

  static getAdvancement({
    objectiveEvaluationDate,
    lastSubObjectiveEvaluationDate,
    objectiveAdvancement,
    subObjectivesAdvancement,
    calculated
  }) {
    if (objectiveEvaluationDate.isAfter(lastSubObjectiveEvaluationDate)) {
      return [objectiveAdvancement, false];
    } else if (calculated) {
      return [subObjectivesAdvancement, true];
    } else {
      if (objectiveAdvancement > subObjectivesAdvancement) {
        return [objectiveAdvancement, false];
      } else {
        return [subObjectivesAdvancement, true];
      }
    }
  }

  static async getCoresWithMonthlyAdvancement(institutionId, classroomId, startDate) {
    const startDateMoment = moment(startDate);
    const months = enumerateMonthsBetweenDates(startDateMoment, moment(), 'YYYY-MM-DD');
    const advancementByCoreAndMonth = {};
    let cores = [];
    const getCoreAdvancement = (core) => ({
      advancement: core.advancement,
      completeness: core.completeness,
      totalEvaluations: core.totalEvaluations,
      possibleEvaluations: core.possibleEvaluations,
    })
    for (let i = 0; i < months.length; i++) {
      const currentMonth = months[i];
      const endDate = months[i + 1];
      const coresWithAdvancement = await getAllCoresWithAdvancement(institutionId, classroomId, startDate, endDate);
      if (i === months.length - 1) {
        cores = coresWithAdvancement.map((core) => ({
          id: core.id,
          name: core.name,
          position: core.position,
          description: core.description,
          currentAdvancement: getCoreAdvancement(core),
        }))
      }
      coresWithAdvancement.forEach((core) => {
        if (!advancementByCoreAndMonth[core.id]) {
          advancementByCoreAndMonth[core.id] = {};
        }
        advancementByCoreAndMonth[core.id][currentMonth] = getCoreAdvancement(core);
      });
    }

    const coresWithMonthlyAdvancement = sortBy(cores, 'position').map((core) => ({
      id: core.id,
      name: core.name,
      position: core.position,
      description: core.description,
      advancementByMonth: advancementByCoreAndMonth[core.id],
    }))

    return coresWithMonthlyAdvancement;
  }
}