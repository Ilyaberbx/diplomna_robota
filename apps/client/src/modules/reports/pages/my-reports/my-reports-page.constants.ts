import type { MyReportsGroupKey } from '../../reports.types.js';

export const MY_REPORTS_GROUP_LABELS: Record<MyReportsGroupKey, string> = {
  active: 'Active',
  recovered: 'Reunited / Resolved',
  closed: 'Closed',
} as const;
