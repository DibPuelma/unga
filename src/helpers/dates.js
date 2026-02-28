import moment from "moment-timezone";

export function enumerateDaysBetweenDates(startDate, endDate, format = 'YYYY-MM-DD') {
  const now = moment(startDate);
  endDate = moment(endDate);
  const dates = [];

  while (now.isSameOrBefore(endDate, 'day')) {
    dates.push(now.format(format));
    now.add(1, 'days');
  }
  return dates;
};

export function enumerateWorkDaysBetweenDates(startDate, endDate, format = 'YYYY-MM-DD') {
  const now = moment(startDate);
  endDate = moment(endDate);
  const dates = [];

  while (now.isSameOrBefore(endDate, 'day')) {
    if (now.day() === 0) {
      now.add(1, 'day');
    } else if (now.day() === 6) {
      now.add(2, 'days');
    }
    dates.push(now.format(format));
    now.add(1, 'days');
  }
  return dates;
};

export function enumerateMonthsBetweenDates(startDate, endDate, format = 'MMMM') {
  const now = moment(startDate);
  endDate = moment(endDate);
  const dates = [];

  while (now.isSameOrBefore(endDate, 'month')) {
    dates.push(now.format(format));
    now.add(1, 'month');
  }
  return dates;
}

export const IS_WEEKEND = moment().day() === 0 || moment().day() === 6;
export const START_OF_CURRENT_WEEK = moment().startOf('week').format('YYYY-MM-DD');
export const END_OF_CURRENT_WEEK = moment().endOf('week').subtract(2, 'days').format('YYYY-MM-DD');