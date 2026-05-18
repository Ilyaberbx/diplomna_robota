import type {
  MyReport,
  MyReportsGroupKey,
  MyReportsGroups,
} from '../../reports.types.js';

function groupKeyFor(report: MyReport['report']): MyReportsGroupKey {
  const isRecovered =
    report.status === 'reunited' || report.status === 'resolved';
  if (isRecovered) return 'recovered';
  const isClosed = report.status === 'closed';
  if (isClosed) return 'closed';
  return 'active';
}

export function groupMyReports(reports: MyReport[]): MyReportsGroups {
  const groups: MyReportsGroups = {
    active: [],
    recovered: [],
    closed: [],
  };
  for (const entry of reports) {
    groups[groupKeyFor(entry.report)].push(entry);
  }
  return groups;
}
