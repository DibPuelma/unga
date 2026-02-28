import moment from 'moment-timezone';
import prisma from 'db/prisma';

/**
 * Get all holidays for an institution within a date range
 * @param {string} institutionId - Institution ID
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Array>} Array of holiday date ranges
 */
export async function getHolidaysForInstitution(institutionId, startDate, endDate) {
  const holidays = await prisma.institutionCalendarEvents.findMany({
    where: {
      institutionId,
      isHoliday: true,
      // Events that overlap with the date range
      startDay: {
        lte: new Date(endDate),
      },
      endDay: {
        gte: new Date(startDate),
      },
    },
  });

  return holidays;
}

/**
 * Check if a date is a holiday for an institution
 * @param {Date|string} date - Date to check
 * @param {Array} holidays - Array of holiday events
 * @returns {boolean} True if the date is a holiday
 */
export function isHoliday(date, holidays) {
  const checkDate = moment(date);
  return holidays.some((holiday) => {
    const startDay = moment(holiday.startDay);
    const endDay = moment(holiday.endDay);
    return checkDate.isSameOrAfter(startDay, 'day') && checkDate.isSameOrBefore(endDay, 'day');
  });
}

/**
 * Check if a date is a weekend
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is a weekend
 */
export function isWeekend(date) {
  const day = moment(date).day();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a workday (not weekend and not holiday)
 * @param {Date|string} date - Date to check
 * @param {Array} holidays - Array of holiday events
 * @returns {boolean} True if the date is a workday
 */
export function isWorkday(date, holidays = []) {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Calculate the number of workdays between two dates (excluding weekends and holidays)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string} institutionId - Institution ID
 * @returns {Promise<number>} Number of workdays
 */
export async function getWorkdaysCount(startDate, endDate, institutionId) {
  const holidays = await getHolidaysForInstitution(institutionId, startDate, endDate);
  const start = moment(startDate);
  const end = moment(endDate);
  let count = 0;

  const current = start.clone();
  while (current.isSameOrBefore(end, 'day')) {
    if (isWorkday(current, holidays)) {
      count++;
    }
    current.add(1, 'day');
  }

  return count;
}

/**
 * Get the start of the current year
 * @returns {moment.Moment} Start of current year
 */
export function getStartOfYear() {
  return moment().startOf('year');
}

/**
 * Get the end of the current year
 * @returns {moment.Moment} End of current year
 */
export function getEndOfYear() {
  return moment().endOf('year');
}

/**
 * Get today's date
 * @returns {moment.Moment} Today
 */
export function getToday() {
  return moment();
}

/**
 * Get date range from start of year to today
 * @returns {Object} Object with startDate and endDate
 */
export function getYearToDateRange() {
  return {
    startDate: getStartOfYear().toDate(),
    endDate: getToday().toDate(),
  };
}

/**
 * Get date range for the entire current year
 * @returns {Object} Object with startDate and endDate
 */
export function getFullYearRange() {
  return {
    startDate: getStartOfYear().toDate(),
    endDate: getEndOfYear().toDate(),
  };
}




