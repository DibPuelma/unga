import moment from 'moment';
import { getAllTeachersWithStatsInRange } from "db/user";
import { emailTeachersWeeklyStats } from 'services/email/reports';

export default class SendTeachersWeeklyStats {
  constructor() {
    this.now = moment().toISOString();
    this.sevenDaysBack = moment().subtract(7, 'days').toISOString();
  }

  async perform() {
    const teachers = await getAllTeachersWithStatsInRange(this.sevenDaysBack, this.now);
    emailTeachersWeeklyStats(teachers);
  }
}