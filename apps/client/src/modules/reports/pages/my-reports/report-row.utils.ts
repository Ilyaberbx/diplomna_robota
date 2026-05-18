import type { PublicReport, RowAction } from '../../reports.types.js';

const CLOSE_ACTION: RowAction = { label: 'Close', target: 'closed' };

export function actionsFor(report: PublicReport): RowAction[] {
  const isActive = report.status === 'active';
  if (!isActive) return [];
  const isLost = report.kind === 'lost';
  const recover: RowAction = isLost
    ? { label: 'Mark reunited', target: 'reunited' }
    : { label: 'Mark resolved', target: 'resolved' };
  return [recover, CLOSE_ACTION];
}
