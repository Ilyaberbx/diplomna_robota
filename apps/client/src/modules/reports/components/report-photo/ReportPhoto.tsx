import { useI18n } from '@/modules/shared/providers/i18n';
import { reportPhotoUrl } from '../../reports.config.js';
import type { ReportPhotoProps } from './report-photo.types.js';
import styles from './report-photo.module.css';

export function ReportPhoto({
  reportId,
  photoKey,
  alt,
  variant,
}: ReportPhotoProps) {
  const { t } = useI18n();
  const hasPhoto = photoKey !== null;
  const frameClass =
    variant === 'detail' ? styles.frameDetail : styles.frameCard;

  if (!hasPhoto)
    return (
      <div
        className={`${frameClass} ${styles.placeholder}`}
        role="img"
        aria-label={t('reportPhoto.placeholderAria', { alt })}
      >
        <span aria-hidden="true" className={styles.placeholderMark}>
          🐾
        </span>
        <span className={styles.placeholderText}>
          {t('reportPhoto.noPhoto')}
        </span>
      </div>
    );

  return (
    <img
      className={frameClass}
      src={reportPhotoUrl(reportId)}
      alt={alt}
      loading="lazy"
    />
  );
}
