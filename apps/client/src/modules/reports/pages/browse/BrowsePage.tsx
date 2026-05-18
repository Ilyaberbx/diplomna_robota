import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useBrowsePage } from './use-browse-page.js';
import styles from './browse-page.module.css';

export function BrowsePage() {
  const { query, state, setKind, setSpecies, setPage } = useBrowsePage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <h1>{t('browse.title')}</h1>
      <div className={styles.filters}>
        <label htmlFor="filter-kind">{t('browse.kind')}</label>
        <select
          id="filter-kind"
          value={query.kind ?? ''}
          onChange={(e) => setKind(e.target.value as 'lost' | 'found' | '')}
        >
          <option value="">{t('browse.all')}</option>
          <option value="lost">{t('common.lost')}</option>
          <option value="found">{t('common.found')}</option>
        </select>
        <label htmlFor="filter-species">{t('browse.species')}</label>
        <select
          id="filter-species"
          value={query.species ?? ''}
          onChange={(e) =>
            setSpecies(
              e.target.value as 'dog' | 'cat' | 'bird' | 'other' | '',
            )
          }
        >
          <option value="">{t('browse.all')}</option>
          <option value="dog">{t('species.dog')}</option>
          <option value="cat">{t('species.cat')}</option>
          <option value="bird">{t('species.bird')}</option>
          <option value="other">{t('species.other')}</option>
        </select>
      </div>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          {t('browse.loading')}
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          {t('browse.empty')}
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('browse.error', { kind: state.error.kind })}
        </p>
      )}

      {state.phase === 'ready' && (
        <>
          <ul className={styles.grid}>
            {state.data.items.map((report) => (
              <li key={report.id} className={styles.card}>
                <Link to={`/reports/${report.id}`}>
                  <ReportPhoto
                    reportId={report.id}
                    photoKey={report.photoKey}
                    alt={report.name ?? report.species}
                    variant="card"
                  />
                  <span className={styles.badge}>
                    {t('browse.badge', {
                      kind: t(`status.${report.kind}`),
                      status: t(`status.${report.status}`),
                    })}
                  </span>
                  <strong>
                    {report.name ?? t(`species.${report.species}`)}
                  </strong>
                  <span className={styles.meta}>
                    {t(`species.${report.species}`)}
                    {report.breed ? ` · ${report.breed}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <nav className={styles.pager} aria-label={t('browse.paginationAria')}>
            <button
              type="button"
              disabled={state.data.page <= 1}
              onClick={() => setPage(state.data.page - 1)}
            >
              {t('browse.previous')}
            </button>
            <span>{t('browse.page', { page: state.data.page })}</span>
            <button
              type="button"
              disabled={
                state.data.page * state.data.pageSize >= state.data.total
              }
              onClick={() => setPage(state.data.page + 1)}
            >
              {t('browse.next')}
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
