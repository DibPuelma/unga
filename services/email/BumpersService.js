import { getNonHeterogeneousLevels } from "db/level";
import { getRegisteredUsersWithDaysAgeEqualTo, getTrialUsersWithDaysAgeEqualTo } from "db/user";
import StatisticsService from "services/StatisticsService";
import { sendExampleActivitiesEmail, sendGenericMassiveEmailWithFirstName } from "./users";
import { intersection } from "lodash";

export default class BumperEmailsService {
  static async sendActivitiesExamplesToRegisteredUsers() {
    const ageInDays = 3;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays, withLevels: true });
    if (users.length === 0) return;

    const levels = await getNonHeterogeneousLevels();
    const levelsIds = levels.map((level) => level.id)
    const usersByLevel = {};
    users.forEach((user) => {
      const userNonHeterogeneusLevels = intersection(levelsIds, user.levelsIds);
      if (userNonHeterogeneusLevels.length === 0) return;

      const levelId = userNonHeterogeneusLevels[0];
      if (!usersByLevel[levelId]) usersByLevel[levelId] = [];
      usersByLevel[levelId].push(user);
    })

    for (let i = 0; i < levelsIds.length; i++) {
      const levelId = levelsIds[i];
      if (!usersByLevel[levelId]) continue;

      const top3UsedActivities = (await StatisticsService.getLast30DaysTopUsedPublicActivitiesForLevel(levelId)).slice(0, 3);
      sendExampleActivitiesEmail(usersByLevel[levelId], top3UsedActivities);
    }
  }

  static async sendPlanningExplanationToRegisteredUsers() {
    const ageInDays = 6;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-983dece0df5e4194a71f04bbd3a7cbe5' });
  }

  static async sendAIPlanningExplanationToRegisteredUsers() {
    const ageInDays = 10;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-e181c6ac6c1644b6aefae7ed6a163653' });
  }

  static async sendEvaluationExplanationToRegisteredUsers() {
    const ageInDays = 14;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-4791853d477c4c55b1b0f7347052020e' });
  }

  static async sendPlanningExplanationToTrialUsers() {
    const ageInDays = 1;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-0b211bb09f924cb0a920833870f8b170' });
  }

  static async sendEvaluationExplanationToTrialUsers() {
    const ageInDays = 2;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-ce3affc04c1b411d815f024017949463' });
  }

  static async sendDownloadReportsExplanationToTrialUsers() {
    const ageInDays = 3;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-32fef3db8b3947dbaf3c685210f2576c' });
  }

  static async sendAttendanceExplanationToTrialUsers() {
    const ageInDays = 4;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({ users, templateId: 'd-5bb46e5c5fc0497187fd5f87eafeba9b' });
  }
}