import moment from "moment-timezone";
import { ascendingSort } from "src/helpers/arrays";

const { getOrCreateClassroomReportConfiguration } = require("db/classroomReportConfiguration");
const { getCoresWithAdvancementForStudentAndDates } = require("db/core");

export default class ReportService {
  constructor(institutionId, classroomId, studentId, classroomReportConfiguration) {
    this.institutionId = institutionId;
    this.classroomId = classroomId;
    this.studentId = studentId;
    this.classroomReportConfiguration = classroomReportConfiguration;
    this.now = moment();
    this.activeTimePeriods = this.#generateActiveTimePeriods();
  }

  static async initializeService(institutionId, classroomId, studentId) {
    const classroomReportConfiguration = await getOrCreateClassroomReportConfiguration(classroomId);
    return new ReportService(institutionId, classroomId, studentId, classroomReportConfiguration);
  }

  async coresWithAdvancement() {
    const diagnosisLevelsOfAchievement = await this.#diagnosis();
    const firstSemesterLevelsOfAchievement = await this.#firstSemester();
    const secondSemesterLevelsOfAchievement = await this.#secondSemester();
    let coresWithAdvancement = this.#mergeTimePeriod([], diagnosisLevelsOfAchievement);
    coresWithAdvancement = this.#mergeTimePeriod(coresWithAdvancement, firstSemesterLevelsOfAchievement);
    coresWithAdvancement = this.#mergeTimePeriod(coresWithAdvancement, secondSemesterLevelsOfAchievement);

    return coresWithAdvancement;
  }

  #generateActiveTimePeriods() {
    return Object.entries(this.classroomReportConfiguration.timePeriods).reduce(
      (acc, [timePeriod, data]) => {
        if (data.show) {
          return { ...acc, [timePeriod]: data };
        }
        return acc;
      },
      {}
    );
  }

  getClassroomReportConfiguration() {
    return this.classroomReportConfiguration;
  }

  getActiveTimePeriods() {
    return this.activeTimePeriods;
  }

  getStartOfYearMoment() {
    return moment(Object.values(this.activeTimePeriods)[0].date).startOf('year');
  }

  getReportDates() {
    const diagnosisEndDate = this.classroomReportConfiguration.timePeriods.diagnosis.date;
    const firstSemesterEndDate = this.classroomReportConfiguration.timePeriods.firstSemester.date;
    const secondSemesterEndDate = this.classroomReportConfiguration.timePeriods.secondSemester.date;
    const startOfDiagnosisYear = moment(diagnosisEndDate).startOf('year').format('YYYY-MM-DD');
    return {
      diagnosis: { startDate: startOfDiagnosisYear, endDate: diagnosisEndDate },
      firstSemester: { startDate: startOfDiagnosisYear, endDate: firstSemesterEndDate },
      secondSemester: { startDate: startOfDiagnosisYear, endDate: secondSemesterEndDate },
    }
  }

  async #diagnosis() {
    const endDate = moment(
      this.classroomReportConfiguration.timePeriods.diagnosis.date
    ).add(1, 'day').format('YYYY-MM-DD');
    const startDate = moment(endDate).startOf('year').format('YYYY-MM-DD');
    return {
      name: this.classroomReportConfiguration.timePeriods.diagnosis.name,
      cores: await getCoresWithAdvancementForStudentAndDates({
        institutionId: this.institutionId,
        studentId: this.studentId,
        startDate,
        endDate,
      }),
    }
  }

  async #firstSemester() {
    if (this.activeTimePeriods.firstSemester) {
      const endDate = moment(
        this.classroomReportConfiguration.timePeriods.firstSemester.date
      ).add(1, 'day').format('YYYY-MM-DD');
      const startDate = moment(endDate).startOf('year').format('YYYY-MM-DD');
      return {
        name: this.classroomReportConfiguration.timePeriods.firstSemester.name,
        cores: await getCoresWithAdvancementForStudentAndDates({
          institutionId: this.institutionId,
          studentId: this.studentId,
          startDate,
          endDate,
        }),
      }
    }
    return null;
  }

  async #secondSemester() {
    if (this.activeTimePeriods.secondSemester) {
      const endDate = moment(
        this.classroomReportConfiguration.timePeriods.secondSemester.date
      ).add(1, 'day').format('YYYY-MM-DD');
      const diagnosisDate = this.classroomReportConfiguration.timePeriods.diagnosis.date;
      const startDate = moment(diagnosisDate).startOf('year').format('YYYY-MM-DD');
      return {
        name: this.classroomReportConfiguration.timePeriods.secondSemester.name,
        cores: await getCoresWithAdvancementForStudentAndDates({
          institutionId: this.institutionId,
          studentId: this.studentId,
          startDate,
          endDate,
        }),
      }
    }
    return null;
  }

  #mergeTimePeriod(base, timePeriod) {
    if (!timePeriod) return base;

    if (base.length === 0) {
      const newCores = [...timePeriod.cores].map((core) => ({
        ...core,
        objectives: {
          [timePeriod.name]: ascendingSort([...core.objectives], 'position'),
        }
      }))
      base = newCores;
      return base;
    }

    return [...timePeriod.cores].map((core, i) => (
      {
        ...base[i],
        objectives: {
          ...base[i].objectives,
          [timePeriod.name]: ascendingSort([...core.objectives], 'position'),
        }
      }
    ))
  }
}