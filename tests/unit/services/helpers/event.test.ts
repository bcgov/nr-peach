import {
  dateTimePartsToEvent,
  eventToDateTimeParts,
  mergeDateAndTimeToISOString
} from '../../../../src/services/helpers/event.ts';

import type { Event } from '../../../../src/types/index.d.ts';

describe('mergeDateAndTimeToISOString', () => {
  it('merges date and time (HH:mm) to ISO string in UTC', () => {
    const date = new Date(Date.UTC(2023, 5, 1)); // 2023-06-01T00:00:00.000Z
    const time = '14:30';
    const result = mergeDateAndTimeToISOString(date, time);
    expect(result).toBe('2023-06-01T14:30:00.000Z');
  });

  it('merges date and time (HH:mm:ss) to ISO string in UTC', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    const time = '14:30:15';
    const result = mergeDateAndTimeToISOString(date, time);
    expect(result).toBe('2023-06-01T14:30:15.000Z');
  });

  it('merges date and time (HH:mm:ss.sss) to ISO string in UTC', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    const time = '14:30:15.123';
    const result = mergeDateAndTimeToISOString(date, time);
    expect(result).toBe('2023-06-01T14:30:15.123Z');
  });

  it('ignores timezone offset in time string', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    const time = '14:30:15.123+02:00';
    const result = mergeDateAndTimeToISOString(date, time);
    expect(result).toBe('2023-06-01T14:30:15.123Z');
  });

  it('throws error for invalid time format', () => {
    const date = new Date(Date.UTC(2023, 5, 1));
    expect(() => mergeDateAndTimeToISOString(date, 'badtime')).toThrow();
  });
});

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
