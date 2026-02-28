import prisma from './prisma';
import moment from 'moment-timezone';

/**
 * Get calendar events for an institution within a date range
 * Events that overlap with the date range are returned
 * @param {string} institutionId - Institution ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of calendar events
 */
export const getInstitutionCalendarEvents = async (institutionId, startDate, endDate) => {
  const events = await prisma.institutionCalendarEvents.findMany({
    where: {
      institutionId,
      shouldShowInCalendar: true,
      // Events that overlap with the date range
      // Event overlaps if: event.startDay <= endDate AND event.endDay >= startDate
      startDay: {
        lte: new Date(endDate),
      },
      endDay: {
        gte: new Date(startDate),
      },
    },
    orderBy: {
      startDay: 'asc',
    },
  });

  return events;
};

/**
 * Create a single calendar event
 * @param {Object} data - Event data
 * @param {string} data.name - Event name
 * @param {string} data.startDay - Start date (YYYY-MM-DD)
 * @param {string} data.endDay - End date (YYYY-MM-DD)
 * @param {boolean} data.shouldShowInCalendar - Whether to show in calendar
 * @param {boolean} data.isHoliday - Whether this is a holiday
 * @param {string} data.institutionId - Institution ID
 * @returns {Promise<Object>} Created event
 */
export const createInstitutionCalendarEvent = async (data) => {
  const { name, startDay, endDay, shouldShowInCalendar, isHoliday, institutionId } = data;

  const event = await prisma.institutionCalendarEvents.create({
    data: {
      name: name.trim(),
      startDay: new Date(startDay),
      endDay: new Date(endDay),
      shouldShowInCalendar: shouldShowInCalendar !== undefined ? shouldShowInCalendar : true,
      isHoliday: isHoliday !== undefined ? isHoliday : false,
      institutionId,
    },
  });

  return event;
};

/**
 * Bulk create calendar events
 * @param {Array<Object>} events - Array of event data objects
 * @returns {Promise<Array>} Array of created events
 */
export const createInstitutionCalendarEvents = async (events) => {
  const eventsToCreate = events.map((event) => ({
    name: event.name.trim(),
    startDay: new Date(event.startDay),
    endDay: new Date(event.endDay),
    shouldShowInCalendar: event.shouldShowInCalendar !== undefined ? event.shouldShowInCalendar : true,
    isHoliday: event.isHoliday !== undefined ? event.isHoliday : false,
    institutionId: event.institutionId,
  }));

  const createdEvents = await prisma.institutionCalendarEvents.createMany({
    data: eventsToCreate,
    skipDuplicates: true,
  });

  return createdEvents;
};

