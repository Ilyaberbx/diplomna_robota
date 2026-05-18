import { useEffect, useState } from 'react';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { browseReports } from '../../api/browse-reports.js';
import type { FeedState } from '../../reports.types.js';

const LANDING_FEED_SIZE = 6;

/**
 * The hybrid landing feed: the most recent active reports near everyone,
 * shown alongside the two primary CTAs. Read-only — no URL sync (that is
 * `/browse`'s job); this surface is reassurance, not search.
 */
export function useLandingPage(): { state: FeedState } {
  const client = useApiClient();
  const [state, setState] = useState<FeedState>({ phase: 'loading' });

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void browseReports(client, {
      status: 'active',
      page: 1,
      pageSize: LANDING_FEED_SIZE,
    }).match(
      (data) => {
        if (!active) return;
        const isEmpty = data.items.length === 0;
        setState(
          isEmpty
            ? { phase: 'empty', page: data.page }
            : { phase: 'ready', data },
        );
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client]);

  return { state };
}
