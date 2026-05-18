import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { getReport } from '../../api/get-report.js';
import type { DetailState } from '../../reports.types.js';

export function useReportDetailPage(): { state: DetailState } {
  const client = useApiClient();
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<DetailState>({ phase: 'loading' });

  useEffect(() => {
    if (!id) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void getReport(client, id).match(
      (report) => {
        if (active) setState({ phase: 'ready', report });
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client, id]);

  return { state };
}
