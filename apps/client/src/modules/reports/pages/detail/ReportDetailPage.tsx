import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useReportDetailPage } from './use-report-detail-page.js';
import styles from './report-detail-page.module.css';

export function ReportDetailPage() {
  const { state } = useReportDetailPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          {t('detail.loading')}
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('detail.error', { kind: state.error.kind })}
        </p>
      )}

      {state.phase === 'ready' && (
        <article>
          <span className={styles.badge}>
            {t('browse.badge', {
              kind: t(`status.${state.report.kind}`),
              status: t(`status.${state.report.status}`),
            })}
          </span>
          <h1>
            {state.report.name ?? t(`species.${state.report.species}`)}
          </h1>
          <ReportPhoto
            reportId={state.report.id}
            photoKey={state.report.photoKey}
            alt={state.report.name ?? state.report.species}
            variant="detail"
          />
          <dl className={styles.facts}>
            <dt>{t('detail.species')}</dt>
            <dd>{t(`species.${state.report.species}`)}</dd>
            <dt>{t('detail.breed')}</dt>
            <dd>{state.report.breed ?? t('common.dash')}</dd>
            <dt>{t('detail.color')}</dt>
            <dd>{state.report.color ?? t('common.dash')}</dd>
            <dt>{t('detail.description')}</dt>
            <dd>{state.report.description ?? t('common.dash')}</dd>
            <dt>{t('detail.lastSeen')}</dt>
            <dd>
              {t('detail.coords', {
                lat: state.report.lat.toFixed(4),
                lng: state.report.lng.toFixed(4),
                date: state.report.eventDate.slice(0, 10),
              })}
            </dd>
          </dl>

          {state.report.viewer === 'owner' ? (
            <section
              className={styles.contact}
              aria-label={t('detail.contactAria')}
            >
              <h2>{t('detail.yourContact')}</h2>
              <p>
                {t('common.phone', {
                  value: state.report.contactPhone ?? t('common.dash'),
                })}
              </p>
              <p>
                {t('common.email', {
                  value: state.report.contactEmail ?? t('common.dash'),
                })}
              </p>
              <Link to={`/reports/${state.report.id}/candidates`}>
                {t('detail.viewCandidates')}
              </Link>
            </section>
          ) : (
            <p className={styles.privacy}>{t('detail.privacy')}</p>
          )}
        </article>
      )}
    </main>
  );
}
