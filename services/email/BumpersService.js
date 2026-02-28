import { getNonHeterogeneousLevels } from "db/level";
import { getRegisteredUsersWithDaysAgeEqualTo, getTrialUsersWithDaysAgeEqualTo } from "db/user";
import StatisticsService from "services/StatisticsService";
import { sendExampleActivitiesEmail, sendGenericMassiveEmailWithFirstName } from "./users";
import { intersection } from "lodash";
import PlanningExplanationEmail from "src/emails/PlanningExplanation";
import AIPlanningExplanationEmail from "src/emails/AIPlanningExplanation";
import EvaluationExplanationEmail from "src/emails/EvaluationExplanation";
import TrialPlanningExplanationEmail from "src/emails/TrialPlanningExplanation";
import TrialEvaluationExplanationEmail from "src/emails/TrialEvaluationExplanation";
import TrialDownloadReportsEmail from "src/emails/TrialDownloadReports";
import TrialAttendanceExplanationEmail from "src/emails/TrialAttendanceExplanation";

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

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: PlanningExplanationEmail,
      subject: 'Planifica mejor en Unga',
    });
  }

  static async sendAIPlanningExplanationToRegisteredUsers() {
    const ageInDays = 10;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: AIPlanningExplanationEmail,
      subject: 'Acelera tu planificacion con IA',
    });
  }

  static async sendEvaluationExplanationToRegisteredUsers() {
    const ageInDays = 14;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: EvaluationExplanationEmail,
      subject: 'Haz seguimiento de avances con Unga',
    });
  }

  static async sendPlanningExplanationToTrialUsers() {
    const ageInDays = 1;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: TrialPlanningExplanationEmail,
      subject: 'Comienza tu prueba planificando',
    });
  }

  static async sendEvaluationExplanationToTrialUsers() {
    const ageInDays = 2;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: TrialEvaluationExplanationEmail,
      subject: 'Evalua en minutos durante tu prueba',
    });
  }

  static async sendDownloadReportsExplanationToTrialUsers() {
    const ageInDays = 3;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: TrialDownloadReportsEmail,
      subject: 'Comparte avances con reportes',
    });
  }

  static async sendAttendanceExplanationToTrialUsers() {
    const ageInDays = 4;
    const users = await getTrialUsersWithDaysAgeEqualTo(ageInDays);
    if (users.length === 0) return;

    sendGenericMassiveEmailWithFirstName({
      users,
      EmailComponent: TrialAttendanceExplanationEmail,
      subject: 'Registra asistencia de forma simple',
    });
  }
}