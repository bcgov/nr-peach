/** Represents the schema for shallow equality checks. */
export type ShallowEqualAttributes =
  | Record<string, ShallowEqualValueType>
  | { attribute: string; type: ShallowEqualValueType }[];

/** Represents the possible value types for shallow equality checks. */
export type ShallowEqualValueType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'undefined';
