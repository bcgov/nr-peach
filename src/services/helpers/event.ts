import { Temporal } from '@js-temporal/polyfill'; // TODO: Remove when Node 26 LTS is out

import type { Event } from '#types';

/**
 * Converts date and time parts into an Event object with appropriate RFC 3339 date or datetime fields.
 *
 * If a start time is provided, the function merges the date and time into ISO datetime strings
 * for both the start and (optionally) end. If no start time is provided, only the date parts
 * are used, formatted as ISO date strings (YYYY-MM-DD).
 * @param parts - An object containing the start and (optionally) end dates and times.
 * - startDate - The start date as a Date object.
 * - startTime - (Optional) The start time as a string (such as "14:00").
 * - endDate - (Optional) The end date as a Date object.
 * - endTime - (Optional) The end time as a string (such as "16:00").
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
      start_date: toPlainDate(startDate).toString(),
      end_date: endDate ? toPlainDate(endDate).toString() : undefined
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
  const eventStart = start_datetime ?? start_date;
  const eventEnd = end_datetime ?? end_date;

  return {
    endDate: eventEnd?.split('T')[0] ?? undefined,
    endTime: end_datetime && eventEnd ? eventEnd.split('T')[1] : undefined,
    startDate: eventStart?.split('T')[0] ?? '',
    startTime: start_datetime ? eventStart.split('T')[1] : undefined
  };
}

/**
 * Merges a given date and a time string into a single RFC 3339 formatted string (UTC) with millisecond precision.
 * @param date - The date object representing the date part.
 * @param time - The time string (such as "14:30:00.001" or "14:30:00+02:00"). Any timezone offsets will be removed.
 * @returns The combined date and time as an RFC 3339 string in UTC (such as "2023-06-01T14:30:00.000Z").
 * @throws If the time string is not in a valid format.
 */
export function mergeDateAndTimeToISOString(date: Date, time: string): string {
  return toPlainDate(date)
    .toPlainDateTime(Temporal.PlainTime.from(time))
    .toZonedDateTime('UTC')
    .toInstant()
    .toString({ fractionalSecondDigits: 3 });
}

/**
 * Converts a Date to its UTC calendar date.
 * @param date - The Date to convert.
 * @returns The UTC calendar date as a Temporal.PlainDate.
 */
export function toPlainDate(date: Date): Temporal.PlainDate {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO('UTC').toPlainDate();
}
