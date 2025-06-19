import type { ParsedQs } from 'qs';

export interface SystemRecordQuery extends ParsedQs {
  record_id: string;
  system_id?: string;
}
