import { getCommunityActivitiesWithinDates, getPublicActivityTimesUsedWithinDatesForLevel } from "db/activity";
import { getCommunityPlannedActivitiesWithinDates } from "db/plannedActivity";
import { getUsersData } from "db/user";
import { orderBy } from "lodash";
import moment from "moment-timezone";

export default class StatisticsService {
  static getCoresWithPonderators(advancementByCore) {
    const advancementCompletenessSum = advancementByCore.reduce(
      (acc, core) => acc + (core.advancement * core.completeness),
      0
    );
    const coresWithPonderators = advancementByCore.map((core) => ({
      ...core,
      ponderator: (core.advancement * core.completeness) / advancementCompletenessSum
    }));

    return coresWithPonderators;
  }

  static async getEducatorsMonthlyRankingByMostPlannedActivities() {
    const startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
    const endDate = moment().add(1, 'day').format('YYYY-MM-DD');
    const plannedActivitiesData = await getCommunityPlannedActivitiesWithinDates(startDate, endDate, 100000);
    const countByCreator = plannedActivitiesData.reduce((acc, data) => {
      const creatorId = data.creator.id;
      const plannerId = data.planner.id;
      if (creatorId !== plannerId) {
        if (!acc[creatorId]) acc[creatorId] = 0;
        acc[creatorId] += 1;
      }
      return acc;
    }, {});
    const countByCreatorArray = Object.entries(countByCreator).map(([creatorId, count]) => ({ creatorId, count }))
    const topFiveCreators = orderBy(countByCreatorArray, 'count', 'desc').slice(0, 5);
    const topFiveCreatorsData = await getUsersData(topFiveCreators.map(({ creatorId }) => creatorId));
    const topFiveCreatorsWithCount = topFiveCreators.map((creator) => {
      const creatorData = topFiveCreatorsData.find((creatorData) => creatorData.id === creator.creatorId);
      return {
        ...creatorData,
        activitiesPlannedByTheCommunity: creator.count,
      }
    })
    return topFiveCreatorsWithCount;
  }

  static async getEducatorsMonthlyRankingByMostSharedActivities() {
    const startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
    const endDate = moment().add(1, 'day').format('YYYY-MM-DD');
    const activities = await getCommunityActivitiesWithinDates({ startDate, endDate, pageSize: 100000 });
    const countByCreator = activities.reduce((acc, activity) => {
      const creatorId = activity.creator.id;
      if (!acc[creatorId]) acc[creatorId] = 0;
      acc[creatorId] += 1;

      return acc;
    }, {});
    const countByCreatorArray = Object.entries(countByCreator).map(([creatorId, count]) => ({ creatorId, count }))
    const topFiveCreators = orderBy(countByCreatorArray, 'count', 'desc').slice(0, 5);
    const topFiveCreatorsData = await getUsersData(topFiveCreators.map(({ creatorId }) => creatorId));
    const topFiveCreatorsWithCount = topFiveCreators.map((creator) => {
      const creatorData = topFiveCreatorsData.find((creatorData) => creatorData.id === creator.creatorId);
      return {
        ...creatorData,
        activitiesShared: creator.count,
      }
    })
    return topFiveCreatorsWithCount;
  }

  static async getLast30DaysTopUsedPublicActivitiesForLevel(levelId) {
    const startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
    const endDate = moment().add(1, 'day').format('YYYY-MM-DD');
    const activities = await getPublicActivityTimesUsedWithinDatesForLevel({
      levelId,
      startDate,
      endDate,
    })

    return orderBy(activities, 'totalTimesUsed', 'desc').map(((activity) => activity.id));
  }

}