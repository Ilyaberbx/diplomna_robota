import { useCreateReportPage } from './use-create-report-page.js';
import styles from './create-report-page.module.css';

export function CreateReportPage() {
  const { fields, errors, submitting, setField, onSubmit } =
    useCreateReportPage();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>
        Report a {fields.kind === 'lost' ? 'lost' : 'found'} pet
      </h1>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <fieldset className={styles.section}>
          <legend>1 — Kind &amp; core facts</legend>
          <div className={styles.field}>
            <label htmlFor="report-kind">Kind</label>
            <select
              id="report-kind"
              value={fields.kind}
              onChange={(e) => setField('kind', e.target.value)}
            >
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="report-species">Species</label>
            <select
              id="report-species"
              value={fields.species}
              onChange={(e) => setField('species', e.target.value)}
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="report-name">Name</label>
            <input
              id="report-name"
              value={fields.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-breed">Breed</label>
            <input
              id="report-breed"
              value={fields.breed}
              onChange={(e) => setField('breed', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-color">Color</label>
            <input
              id="report-color"
              value={fields.color}
              onChange={(e) => setField('color', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-description">Description</label>
            <textarea
              id="report-description"
              value={fields.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>2 — Location &amp; date</legend>
          <div className={styles.field}>
            <label htmlFor="report-lat">Latitude</label>
            <input
              id="report-lat"
              inputMode="decimal"
              value={fields.lat}
              onChange={(e) => setField('lat', e.target.value)}
            />
            {errors.lat ? (
              <p role="alert" className={styles.error}>
                {errors.lat}
              </p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="report-lng">Longitude</label>
            <input
              id="report-lng"
              inputMode="decimal"
              value={fields.lng}
              onChange={(e) => setField('lng', e.target.value)}
            />
            {errors.lng ? (
              <p role="alert" className={styles.error}>
                {errors.lng}
              </p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="report-date">Date last seen / found</label>
            <input
              id="report-date"
              type="date"
              value={fields.eventDate}
              onChange={(e) => setField('eventDate', e.target.value)}
            />
            {errors.eventDate ? (
              <p role="alert" className={styles.error}>
                {errors.eventDate}
              </p>
            ) : null}
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>3 — Contact (photo can be added later)</legend>
          <div className={styles.field}>
            <label htmlFor="report-phone">Contact phone</label>
            <input
              id="report-phone"
              value={fields.contactPhone}
              onChange={(e) => setField('contactPhone', e.target.value)}
            />
            {errors.contactPhone ? (
              <p role="alert" className={styles.error}>
                {errors.contactPhone}
              </p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="report-email">Contact email</label>
            <input
              id="report-email"
              value={fields.contactEmail}
              onChange={(e) => setField('contactEmail', e.target.value)}
            />
            {errors.contactEmail ? (
              <p role="alert" className={styles.error}>
                {errors.contactEmail}
              </p>
            ) : null}
          </div>
        </fieldset>

        {errors.form ? (
          <p role="alert" className={styles.error}>
            {errors.form}
          </p>
        ) : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish report'}
        </button>
      </form>
    </main>
  );
}
