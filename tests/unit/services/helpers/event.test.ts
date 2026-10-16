import {
  dateTimePartsToEvent,
  eventToDateTimeParts,
  mergeDateAndTimeToISOString,
  toPlainDate
} from '#src/services/helpers/event';

import type { Event } from '#types';

describe('dateTimePartsToEvent', () => {
  it('returns start_datetime and end_datetime when times are provided', () => {
    const startDate = new Date(Date.UTC(2023, 5, 1));
    const endDate = new Date(Date.UTC(2023, 5, 2));
    const result = dateTimePartsToEvent({
      startDate,
      startTime: '10:00',
      endDate,
      endTime: '12:00'
    });
    expect(result).toEqual({
      start_datetime: '2023-06-01T10:00:00.000Z',
      end_datetime: '2023-06-02T12:00:00.000Z'
    });
  });

  it('returns only start_datetime when end time/date is missing', () => {
    const startDate = new Date(Date.UTC(2023, 5, 1));
    const result = dateTimePartsToEvent({
      startDate,
      startTime: '10:00'
    });
    expect(result).toEqual({
      start_datetime: '2023-06-01T10:00:00.000Z',
      end_datetime: undefined
    });
  });

  it('returns start_date and end_date when times are not provided', () => {
    const startDate = new Date(Date.UTC(2023, 5, 1));
    const endDate = new Date(Date.UTC(2023, 5, 2));
    const result = dateTimePartsToEvent({
      startDate,
      endDate
    });
    expect(result).toEqual({
      start_date: '2023-06-01',
      end_date: '2023-06-02'
    });
  });

  it('returns only start_date when end date is missing and no times', () => {
    const startDate = new Date(Date.UTC(2023, 5, 1));
    const result = dateTimePartsToEvent({
      startDate
    });
    expect(result).toEqual({
      start_date: '2023-06-01',
      end_date: undefined
    });
  });
});

describe('eventToDateTimeParts', () => {
  it('extracts date and time parts from event with datetimes', () => {
    const event: Event = {
      start_datetime: '2023-06-01T10:00:00.000Z',
      end_datetime: '2023-06-02T12:00:00.000Z'
    };
    const result = eventToDateTimeParts(event);
    expect(result).toEqual({
      startDate: '2023-06-01',
      startTime: '10:00:00.000Z',
      endDate: '2023-06-02',
      endTime: '12:00:00.000Z'
    });
  });

  it('extracts only start date and time if end is missing', () => {
    const event: Event = {
      start_datetime: '2023-06-01T10:00:00.000Z'
    };
    const result = eventToDateTimeParts(event);
    expect(result).toEqual({
      startDate: '2023-06-01',
      startTime: '10:00:00.000Z',
      endDate: undefined,
      endTime: undefined
    });
  });

  it('extracts date parts from event with only dates', () => {
    const event: Event = {
      start_date: '2023-06-01',
      end_date: '2023-06-02'
    };
    const result = eventToDateTimeParts(event);
    expect(result).toEqual({
      startDate: '2023-06-01',
      startTime: undefined,
      endDate: '2023-06-02',
      endTime: undefined
    });
  });

  it('extracts only start date if only start_date is present', () => {
    const event: Event = {
      start_date: '2023-06-01'
    };
    const result = eventToDateTimeParts(event);
    expect(result).toEqual({
      startDate: '2023-06-01',
      startTime: undefined,
      endDate: undefined,
      endTime: undefined
    });
  });
});

describe('mergeDateAndTimeToISOString', () => {
  it.each([
    ['HH:mm', '14:30', '2023-06-01T14:30:00.000Z'],
    ['HH:mm:ss', '14:30:15', '2023-06-01T14:30:15.000Z'],
    ['HH:mm:ss.sss', '14:30:15.123', '2023-06-01T14:30:15.123Z'],
    ['time with timezone offset', '14:30:15.123+02:00', '2023-06-01T14:30:15.123Z']
  ])('merges date and time (%s) to ISO string in UTC', (_format, time, expected) => {
    const date = new Date(Date.UTC(2023, 5, 1));
    expect(mergeDateAndTimeToISOString(date, time)).toBe(expected);
  });

  it('throws error for invalid time format', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    expect(() => mergeDateAndTimeToISOString(date, 'badtime')).toThrow();
  });

  it('throws error for non-numeric hour', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    expect(() => mergeDateAndTimeToISOString(date, 'xx:30')).toThrow('Invalid numeric values in time: xx:30');
  });

  it('throws error for non-numeric minute', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    expect(() => mergeDateAndTimeToISOString(date, '14:xx')).toThrow('Invalid numeric values in time: 14:xx');
  });

  it('throws error for non-numeric second', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    expect(() => mergeDateAndTimeToISOString(date, '14:30:xx')).toThrow('Invalid numeric values in time: 14:30:xx');
  });
});

describe('toPlainDate', () => {
  it('returns the UTC calendar date at midnight', () => {
    expect(toPlainDate(new Date(Date.UTC(2023, 5, 1))).toString()).toBe('2023-06-01');
  });

  it('ignores the time of day', () => {
    expect(toPlainDate(new Date('2023-06-01T23:59:59.999Z')).toString()).toBe('2023-06-01');
  });

  it('uses UTC rather than local time near day boundaries', () => {
    expect(toPlainDate(new Date('2023-06-01T00:00:00.000+05:00')).toString()).toBe('2023-05-31');
  });

  it('handles leap days and year boundaries', () => {
    expect(toPlainDate(new Date('2024-02-29T12:00:00Z')).toString()).toBe('2024-02-29');
    expect(toPlainDate(new Date('2023-12-31T23:59:59Z')).toString()).toBe('2023-12-31');
  });

  it('handles dates before the epoch', () => {
    expect(toPlainDate(new Date('1969-12-31T23:59:59Z')).toString()).toBe('1969-12-31');
  });

  it('throws for an invalid Date', () => {
    expect(() => toPlainDate(new Date('invalid'))).toThrow();
  });
});
