import { getFullActivity, searchActivities } from "db/activity";
import { getClassroom } from "db/class";
import { getAllCoresWithAdvancement } from "db/core";
import { getInstitution } from "db/institution";
import { getPlannedActivitiesByClassroomAndDates } from "db/plannedActivity";
import moment from "moment-timezone";
import StatisticsService from "./StatisticsService";
import { orderBy, sampleSize } from "lodash";

export default class SuggestCalendarService {
  constructor(classroom, advancementByCore, lastMonthPlannedActivities, lockedActivitiesIdsByDay) {
    this.classroom = classroom;
    this.advancementByCore = advancementByCore;
    this.ponderatedCores = orderBy(StatisticsService.getCoresWithPonderators(advancementByCore), 'ponderator', 'desc');
    this.lastMonthActivitiesIds = lastMonthPlannedActivities.map((plannedActivity) => plannedActivity.activity.id);
    this.lockedActivitiesIdsByDay = lockedActivitiesIdsByDay;
  }

  static async initializeService(classroomId, referenceDate, lockedActivitiesIdsByDay) {
    const classroom = await getClassroom(classroomId);
    const institutionId = classroom.institution.id;
    const institution = await getInstitution(institutionId);
    if (!institution.features.includes('suggestCalendar')) {
      return null;
    }
    const advancementByCore = await getAllCoresWithAdvancement(institutionId, classroomId);
    const oneMonthAgo = moment(referenceDate).subtract(1, 'month').format('YYYY-MM-DD');
    const oneMonthInTheFuture = moment(referenceDate).add(1, 'month').format('YYYY-MM-DD');
    const lastMonthPlannedActivities = await getPlannedActivitiesByClassroomAndDates(classroomId, oneMonthAgo, oneMonthInTheFuture);
    return new SuggestCalendarService(classroom, advancementByCore, lastMonthPlannedActivities, lockedActivitiesIdsByDay);
  }

  async getWeeklyActivitiesByDay() {
    const activities = await this.#getActivities();
    const activitiesByDay = {};
    const alreadyUsedActivitiesIds = [];
    let coreIndexToUse = 0;
    let timesCoreUsed = 0;
    // Monday to friday = 1 to 5
    for (let day = 1; day <= 5; day++) {
      const lockedActivities = await this.#getLockedActivitiesByDay(day);
      const lockedCount = this.lockedActivitiesIdsByDay[day]?.length ?? 0;
      if (lockedCount === 3) {
        activitiesByDay[day] = lockedActivities;
        continue;
      }
      if (timesCoreUsed == 2) {
        coreIndexToUse++;
        timesCoreUsed = 0;
      }
      let selectedActivities = [];
      while (selectedActivities.length === 0 && coreIndexToUse < this.ponderatedCores.length) {
        selectedActivities = sampleSize(activities.filter((activity) => (
          activity.cores.map((core) => core.name).includes(this.ponderatedCores[coreIndexToUse].name)
          && !alreadyUsedActivitiesIds.includes(activity.id)
          && !this.lockedActivitiesIdsByDay[day]?.includes(activity.id)
        )), Math.max(3 - lockedCount, 0));
        if (selectedActivities.length === 0) {
          coreIndexToUse++;
          timesCoreUsed = 0;
        }
      }
      selectedActivities.forEach((activity) => alreadyUsedActivitiesIds.push(activity.id));
      activitiesByDay[day] = [...lockedActivities, ...selectedActivities];
      timesCoreUsed += 1;
    }

    return activitiesByDay;
  }

  async #getActivities() {
    const coresNames = this.ponderatedCores.map((core) => core.name).join(',');
    const activities = await searchActivities({
      pageSize: 100,
      publiclyAvailable: true,
      recommendedLevels: this.classroom.level.id,
      cores: coresNames,
    })
    const notUsedActivitiesInLastMonth = activities.data.filter(
      (activity) => !this.lastMonthActivitiesIds.includes(activity.id)
    );

    return notUsedActivitiesInLastMonth;
  }

  async #getLockedActivitiesByDay(day) {
    const stringDay = day.toString();
    const lockedActivitiesIds = this.lockedActivitiesIdsByDay[stringDay] || [];
    const dailyLockedActivities = await Promise.all(lockedActivitiesIds.map((activityId) => getFullActivity(activityId)));
    return dailyLockedActivities;
  }
}