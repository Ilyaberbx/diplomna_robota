import { reportPhotoUrl } from '../../reports.config.js';
import type { ReportPhotoProps } from './report-photo.types.js';
import styles from './report-photo.module.css';

export function ReportPhoto({
  reportId,
  photoKey,
  alt,
  variant,
}: ReportPhotoProps) {
  const hasPhoto = photoKey !== null;
  const frameClass =
    variant === 'detail' ? styles.frameDetail : styles.frameCard;

  if (!hasPhoto)
    return (
      <div
        className={`${frameClass} ${styles.placeholder}`}
        role="img"
        aria-label={`${alt} — no photo yet`}
      >
        <span aria-hidden="true" className={styles.placeholderMark}>
          🐾
        </span>
        <span className={styles.placeholderText}>No photo yet</span>
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
