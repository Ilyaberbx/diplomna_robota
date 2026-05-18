import type { TKey } from '@/modules/shared/providers/i18n';
import type { MyReportsGroupKey } from '../../reports.types.js';

/** Group → i18n catalog key; the page resolves it through `t()`. */
export const MY_REPORTS_GROUP_LABEL_KEYS: Record<MyReportsGroupKey, TKey> = {
  active: 'myReports.group.active',
  recovered: 'myReports.group.recovered',
  closed: 'myReports.group.closed',
} as const;
