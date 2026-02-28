import moment from 'moment';
import { getAllTeachersWithStatsInRange } from "db/user";

export default class SendTeachersWeeklyStats {
  constructor() {
    this.now = moment().toISOString();
    this.sevenDaysBack = moment().subtract(7, 'days').toISOString();
  }

  async perform() {
    // Weekly stats emails are currently disabled.
    await getAllTeachersWithStatsInRange(this.sevenDaysBack, this.now);
  }
}