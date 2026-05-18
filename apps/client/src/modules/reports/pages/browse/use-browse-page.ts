import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { browseReports } from '../../api/browse-reports.js';
import type {
  BrowseQuery,
  FeedState,
  ReportKind,
  ReportSpecies,
} from '../../reports.types.js';

function readQuery(params: URLSearchParams): BrowseQuery {
  const kind = params.get('kind');
  const species = params.get('species');
  const pageRaw = Number(params.get('page'));
  return {
    kind: kind === 'lost' || kind === 'found' ? kind : undefined,
    species:
      species === 'dog' ||
      species === 'cat' ||
      species === 'bird' ||
      species === 'other'
        ? species
        : undefined,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function useBrowsePage(): {
  query: BrowseQuery;
  state: FeedState;
  setKind: (kind: ReportKind | '') => void;
  setSpecies: (species: ReportSpecies | '') => void;
  setPage: (page: number) => void;
} {
  const client = useApiClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => readQuery(searchParams), [searchParams]);
  const [state, setState] = useState<FeedState>({ phase: 'loading' });

  const patch = useCallback(
    (next: Partial<Record<'kind' | 'species' | 'page', string>>) => {
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(next)) {
          if (v === '' || v === undefined) sp.delete(k);
          else sp.set(k, v);
        }
        return sp;
      });
    },
    [setSearchParams],
  );

  const setKind = useCallback(
    (kind: ReportKind | '') => patch({ kind, page: '1' }),
    [patch],
  );
  const setSpecies = useCallback(
    (species: ReportSpecies | '') => patch({ species, page: '1' }),
    [patch],
  );
  const setPage = useCallback(
    (page: number) => patch({ page: String(page) }),
    [patch],
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void browseReports(client, query).match(
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
  }, [client, query]);

  return { query, state, setKind, setSpecies, setPage };
}
