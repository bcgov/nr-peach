import type { Event } from '../../types/index.d.ts';

/**
 * Converts date and time parts into an Event object with appropriate RFC 3339 date or datetime fields.
 *
 * If a start time is provided, the function merges the date and time into ISO datetime strings
 * for both the start and (optionally) end. If no start time is provided, only the date parts
 * are used, formatted as ISO date strings (YYYY-MM-DD).
 * @param parts - An object containing the start and (optionally) end dates and times.
 * @param parts.startDate - The start date as a Date object.
 * @param parts.startTime - (Optional) The start time as a string (e.g., "14:00").
 * @param parts.endDate - (Optional) The end date as a Date object.
 * @param parts.endTime - (Optional) The end time as a string (e.g., "16:00").
 * @returns An Event object with either `start_datetime`/`end_datetime` or `start_date`/`end_date` fields.
 */
export function dateTimePartsToEvent(parts: {
  startDate: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
}): Event {
  const { startDate, startTime, endDate, endTime } = parts;

  if (startTime) {
    return {
      start_datetime: mergeDateAndTimeToISOString(startDate, startTime),
      end_datetime: endDate && endTime ? mergeDateAndTimeToISOString(endDate, endTime) : undefined
    };
  } else {
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate ? endDate.toISOString().split('T')[0] : undefined
    };
  }
}

/**
 * Extracts and formats the RFC 3339 start and end date/time parts from an event object.
 * @param event - The event object containing date and/or datetime fields.
 * @returns An object with `startDate`, `startTime`, `endDate`, and `endTime` properties if applicable.
 */
export function eventToDateTimeParts(event: Event): {
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
} {
  const { start_datetime, start_date, end_datetime, end_date } = event;
  const eventStart = start_datetime ?? start_date!;
  const eventEnd = end_datetime ?? end_date;

  return {
    endDate: eventEnd?.split('T')[0],
    endTime: end_datetime ? eventEnd?.split('T')[1] : undefined,
    startDate: eventStart.split('T')[0],
    startTime: start_datetime ? eventStart.split('T')[1] : undefined
  };
}

/**
 * Merges a given date and a time string into a single RFC 3339 formatted string (UTC).
 * @param date - The date object representing the date part.
 * @param time - The time string (e.g., "14:30:00.001" or "14:30:00+02:00"). Any timezone offsets will be removed.
 * @returns The combined date and time as an RFC 3339 string in UTC (e.g., "2023-06-01T14:30:00.000Z").
 * @throws {Error} If the time string is not in a valid format.
 */
export function mergeDateAndTimeToISOString(date: Date, time: string): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Strip anything after the time (Z, +00:00, etc.) and split
  const cleanTime = time.split(/[Z+-]/)[0];
  const timeParts = cleanTime.split(':');
  if (timeParts.length < 2) throw new Error(`Invalid time format: ${time}`);

  const hour = Number.parseInt(timeParts[0], 10);
  const minute = Number.parseInt(timeParts[1], 10);

  // Handle optional seconds and milliseconds
  const secondsPart = timeParts[2]?.split('.') || ['0', '0'];
  const second = Number.parseInt(secondsPart[0], 10);
  const ms = Number.parseInt(secondsPart[1] || '0', 10);
  if ([hour, minute, second].some((num) => Number.isNaN(num))) {
    throw new Error(`Invalid numeric values in time: ${time}`);
  }

  return new Date(Date.UTC(year, month, day, hour, minute, second, ms)).toISOString();
}
