import { Link } from 'react-router-dom';
import { useBrowsePage } from './use-browse-page.js';
import styles from './browse-page.module.css';

export function BrowsePage() {
  const { query, state, setKind, setSpecies, setPage } = useBrowsePage();

  return (
    <main className={styles.page}>
      <h1>Browse reports</h1>
      <div className={styles.filters}>
        <label htmlFor="filter-kind">Kind</label>
        <select
          id="filter-kind"
          value={query.kind ?? ''}
          onChange={(e) => setKind(e.target.value as 'lost' | 'found' | '')}
        >
          <option value="">All</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <label htmlFor="filter-species">Species</label>
        <select
          id="filter-species"
          value={query.species ?? ''}
          onChange={(e) =>
            setSpecies(
              e.target.value as 'dog' | 'cat' | 'bird' | 'other' | '',
            )
          }
        >
          <option value="">All</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="bird">Bird</option>
          <option value="other">Other</option>
        </select>
      </div>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          Loading reports…
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          No reports match these filters yet — file one and we&apos;ll watch
          for matches.
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not load reports ({state.error.kind}).
        </p>
      )}

      {state.phase === 'ready' && (
        <>
          <ul className={styles.grid}>
            {state.data.items.map((report) => (
              <li key={report.id} className={styles.card}>
                <Link to={`/reports/${report.id}`}>
                  <span className={styles.badge}>
                    {report.kind === 'lost' ? 'Lost' : 'Found'} ·{' '}
                    {report.status}
                  </span>
                  <strong>{report.name ?? report.species}</strong>
                  <span className={styles.meta}>
                    {report.species}
                    {report.breed ? ` · ${report.breed}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <nav className={styles.pager} aria-label="Pagination">
            <button
              type="button"
              disabled={state.data.page <= 1}
              onClick={() => setPage(state.data.page - 1)}
            >
              Previous
            </button>
            <span>Page {state.data.page}</span>
            <button
              type="button"
              disabled={
                state.data.page * state.data.pageSize >= state.data.total
              }
              onClick={() => setPage(state.data.page + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
