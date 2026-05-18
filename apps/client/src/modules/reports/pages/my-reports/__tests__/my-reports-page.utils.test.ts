import { describe, expect, it } from 'vitest';
import { groupMyReports } from '../my-reports-page.utils.js';
import { actionsFor } from '../report-row.utils.js';
import { reportFixture } from '../__fixtures__/render-my-reports-page.js';

function entry(id: string, over: Record<string, unknown> = {}) {
  return { report: reportFixture(id, over) as never, candidateCount: null };
}

describe('groupMyReports', () => {
  it('routes each status to its group', () => {
    const groups = groupMyReports([
      entry('a', { status: 'active' }),
      entry('b', { status: 'reunited' }),
      entry('c', { status: 'resolved' }),
      entry('d', { status: 'closed' }),
    ]);
    expect(groups.active.map((e) => e.report.id)).toEqual(['a']);
    expect(groups.recovered.map((e) => e.report.id)).toEqual(['b', 'c']);
    expect(groups.closed.map((e) => e.report.id)).toEqual(['d']);
  });
});

describe('actionsFor', () => {
  it('offers reunited + close for an active Lost report', () => {
    const actions = actionsFor(
      reportFixture('l', { kind: 'lost', status: 'active' }) as never,
    );
    expect(actions.map((a) => a.target)).toEqual(['reunited', 'closed']);
  });

  it('offers resolved + close for an active Found report', () => {
    const actions = actionsFor(
      reportFixture('f', { kind: 'found', status: 'active' }) as never,
    );
    expect(actions.map((a) => a.target)).toEqual(['resolved', 'closed']);
  });

  it('offers no actions for a terminal report', () => {
    const actions = actionsFor(
      reportFixture('x', { status: 'closed' }) as never,
    );
    expect(actions).toEqual([]);
  });
});
