import type { OwnerReport } from '../../matches.types.js';
import styles from './match-detail-page.module.css';

function ContactBlock({
  label,
  report,
}: {
  label: string;
  report: OwnerReport;
}) {
  return (
    <div>
      <h3>
        {label}: {report.name ?? report.species}
      </h3>
      <p>Phone: {report.contactPhone ?? '—'}</p>
      <p>Email: {report.contactEmail ?? '—'}</p>
    </div>
  );
}

export function RevealedContactPanel({
  lostReport,
  foundReport,
}: {
  lostReport: OwnerReport;
  foundReport: OwnerReport;
}) {
  return (
    <section
      className={styles.reveal}
      aria-label="Revealed contact details"
    >
      <h2>Contact details revealed</h2>
      <p className={styles.status}>
        These details are shown because this match is confirmed. They stay
        hidden everywhere else.
      </p>
      <ContactBlock label="Lost report" report={lostReport} />
      <ContactBlock label="Found report" report={foundReport} />
    </section>
  );
}
