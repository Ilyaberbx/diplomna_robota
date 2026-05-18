import type { PublicReport, RowAction } from '../../reports.types.js';

const CLOSE_ACTION: RowAction = {
  labelKey: 'rowAction.close',
  target: 'closed',
};

export function actionsFor(report: PublicReport): RowAction[] {
  const isActive = report.status === 'active';
  if (!isActive) return [];
  const isLost = report.kind === 'lost';
  const recover: RowAction = isLost
    ? { labelKey: 'rowAction.markReunited', target: 'reunited' }
    : { labelKey: 'rowAction.markResolved', target: 'resolved' };
  return [recover, CLOSE_ACTION];
}
