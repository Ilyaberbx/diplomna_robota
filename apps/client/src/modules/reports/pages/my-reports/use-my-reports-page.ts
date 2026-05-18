import { useCallback, useEffect, useState } from 'react';
import { useAuthSession } from '@/modules/auth';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { getCandidates } from '../../api/get-candidates.js';
import { getMyReports } from '../../api/get-my-reports.js';
import { changeReportStatus } from '../../api/change-report-status.js';
import { groupMyReports } from './my-reports-page.utils.js';
import type {
  MyReport,
  MyReportsPageValue,
  MyReportsState,
  StatusTarget,
} from '../../reports.types.js';
import type { ApiClient } from '@/modules/shared/http/http.types';

function loadCandidateCount(
  client: ApiClient,
  report: MyReport['report'],
): Promise<number | null> {
  const isActive = report.status === 'active';
  if (!isActive) return Promise.resolve(null);
  return getCandidates(client, report.id).match(
    (candidates) => candidates.length,
    () => null,
  );
}

export function useMyReportsPage(): MyReportsPageValue {
  const client = useApiClient();
  const { session } = useAuthSession();
  const [state, setState] = useState<MyReportsState>({ phase: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  const reporterId =
    session.phase === 'authenticated' ? session.user.id : null;

  useEffect(() => {
    if (reporterId === null) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void getMyReports(client, reporterId).match(
      async (reports) => {
        const withCounts: MyReport[] = await Promise.all(
          reports.map(async (report) => ({
            report,
            candidateCount: await loadCandidateCount(client, report),
          })),
        );
        if (!active) return;
        const isEmpty = withCounts.length === 0;
        setState(
          isEmpty
            ? { phase: 'empty' }
            : { phase: 'ready', groups: groupMyReports(withCounts) },
        );
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client, reporterId, reloadKey]);

  const onChangeStatus = useCallback(
    (reportId: string, target: StatusTarget) =>
      changeReportStatus(client, reportId, target).map((projection) => {
        setReloadKey((key) => key + 1);
        return projection;
      }),
    [client],
  );

  return { state, onChangeStatus };
}
