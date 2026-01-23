import type { ParsedQs } from 'qs';

export interface SystemRecordQuery extends ParsedQs {
  record_id: string;
  system_id?: string;
}

export interface LinkedSystemRecordQuery extends ParsedQs {
  linked_record_id: string;
  linked_system_id?: string;
}
