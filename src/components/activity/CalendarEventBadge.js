import { Chip, Stack } from '@mui/material';
import moment from 'moment-timezone';

/**
 * CalendarEventBadge - Displays a subtle badge for calendar events
 * @param {Object} event - Calendar event object
 * @param {string} event.name - Event name
 * @param {Date|string} event.startDay - Start date
 * @param {Date|string} event.endDay - End date
 * @param {Date|string} currentDay - Current day being displayed
 */
export default function CalendarEventBadge({ event, currentDay }) {
  const startDay = moment(event.startDay);
  const endDay = moment(event.endDay);
  const day = moment(currentDay);

  // Check if event overlaps with current day
  const isEventDay = day.isSameOrAfter(startDay, 'day') && day.isSameOrBefore(endDay, 'day');

  if (!isEventDay) {
    return null;
  }

  return (
    <Chip
      label={event.name}
      size="small"
      sx={{
        fontSize: '0.7rem',
        height: '20px',
        backgroundColor: (theme) => theme.palette.grey[200],
        color: (theme) => theme.palette.text.secondary,
        fontWeight: 400,
        '& .MuiChip-label': {
          padding: '0 8px',
        },
      }}
    />
  );
}

/**
 * CalendarEventsList - Displays multiple calendar events for a day
 * @param {Array} events - Array of calendar event objects
 * @param {Date|string} currentDay - Current day being displayed
 */
export function CalendarEventsList({ events = [], currentDay }) {
  if (!events || events.length === 0) {
    return null;
  }

  const dayEvents = events.filter((event) => {
    const startDay = moment(event.startDay);
    const endDay = moment(event.endDay);
    const day = moment(currentDay);
    return day.isSameOrAfter(startDay, 'day') && day.isSameOrBefore(endDay, 'day');
  });

  if (dayEvents.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mb={1}>
      {dayEvents.map((event) => (
        <CalendarEventBadge key={event.id} event={event} currentDay={currentDay} />
      ))}
    </Stack>
  );
}

