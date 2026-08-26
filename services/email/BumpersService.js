import { getRegisteredUsersWithDaysAgeEqualTo } from "db/user";
import { sendGenericMassiveEmailWithMagicLink } from "./users";
import OnboardingDay1Email from "src/emails/OnboardingDay1";
import OnboardingDay3Email from "src/emails/OnboardingDay3";
import OnboardingDay5Email from "src/emails/OnboardingDay5";
import OnboardingDay7Email from "src/emails/OnboardingDay7";

export default class BumperEmailsService {
  static async sendOnboardingDay1Email() {
    const ageInDays = 1;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays, role: 'teacher' });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithMagicLink({
      users,
      EmailComponent: OnboardingDay1Email,
      subject: '🪄 Crea tu primera experiencia en segundos',
      callbackUrl: '/',
    });
  }

  static async sendOnboardingDay3Email() {
    const ageInDays = 3;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays, role: 'teacher' });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithMagicLink({
      users,
      EmailComponent: OnboardingDay3Email,
      subject: '🎯 Experiencias alineadas a las Bases Curriculares, listas para imprimir',
      callbackUrl: '/activities',
    });
  }

  static async sendOnboardingDay5Email() {
    const ageInDays = 5;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays, role: 'teacher' });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithMagicLink({
      users,
      EmailComponent: OnboardingDay5Email,
      subject: '🗓️ Tu semana planificada en minutos',
      callbackUrl: '/planning',
    });
  }

  static async sendOnboardingDay7Email() {
    const ageInDays = 7;
    const users = await getRegisteredUsersWithDaysAgeEqualTo({ ageInDays, role: 'teacher' });
    if (users.length === 0) return;

    sendGenericMassiveEmailWithMagicLink({
      users,
      EmailComponent: OnboardingDay7Email,
      subject: '🌟 Todo lo que ganas con Unga',
      callbackUrl: '/',
    });
  }
}
