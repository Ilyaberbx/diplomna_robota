import { useI18n } from '@/modules/shared/providers/i18n';
import type { TKey } from '@/modules/shared/providers/i18n';
import { useCreateReportPage } from './use-create-report-page.js';
import styles from './create-report-page.module.css';

export function CreateReportPage() {
  const {
    fields,
    errors,
    submitting,
    photoName,
    setField,
    setPhoto,
    skipPhoto,
    onSubmit,
  } = useCreateReportPage();
  const { t } = useI18n();
  // Error values are i18n keys; Zod's built-in messages pass through t()
  // unchanged (translate() falls back to the input for non-catalog keys).
  const err = (message?: string) =>
    message ? t(message as TKey) : null;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>
        {fields.kind === 'lost'
          ? t('create.titleLost')
          : t('create.titleFound')}
      </h1>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <fieldset className={styles.section}>
          <legend>{t('create.section1')}</legend>
          <div className={styles.field}>
            <label htmlFor="report-kind">{t('create.kind')}</label>
            <select
              id="report-kind"
              value={fields.kind}
              onChange={(e) => setField('kind', e.target.value)}
            >
              <option value="lost">{t('common.lost')}</option>
              <option value="found">{t('common.found')}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="report-species">{t('create.species')}</label>
            <select
              id="report-species"
              value={fields.species}
              onChange={(e) => setField('species', e.target.value)}
            >
              <option value="dog">{t('species.dog')}</option>
              <option value="cat">{t('species.cat')}</option>
              <option value="bird">{t('species.bird')}</option>
              <option value="other">{t('species.other')}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="report-name">{t('create.name')}</label>
            <input
              id="report-name"
              value={fields.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-breed">{t('create.breed')}</label>
            <input
              id="report-breed"
              value={fields.breed}
              onChange={(e) => setField('breed', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-color">{t('create.color')}</label>
            <input
              id="report-color"
              value={fields.color}
              onChange={(e) => setField('color', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-description">
              {t('create.description')}
            </label>
            <textarea
              id="report-description"
              value={fields.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>{t('create.section2')}</legend>
          <div className={styles.field}>
            <label htmlFor="report-lat">{t('create.latitude')}</label>
            <input
              id="report-lat"
              inputMode="decimal"
              value={fields.lat}
              onChange={(e) => setField('lat', e.target.value)}
            />
            {errors.lat ? (
              <p role="alert" className={styles.error}>
                {err(errors.lat)}
              </p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="report-lng">{t('create.longitude')}</label>
            <input
              id="report-lng"
              inputMode="decimal"
              value={fields.lng}
              onChange={(e) => setField('lng', e.target.value)}
            />
            {errors.lng ? (
              <p role="alert" className={styles.error}>
                {err(errors.lng)}
              </p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="report-date">{t('create.date')}</label>
            <input
              id="report-date"
              type="date"
              value={fields.eventDate}
              onChange={(e) => setField('eventDate', e.target.value)}
            />
            {errors.eventDate ? (
              <p role="alert" className={styles.error}>
                {err(errors.eventDate)}
              </p>
            ) : null}
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>{t('create.section3')}</legend>
          <p className={styles.hint}>{t('create.photoHint')}</p>
          <div className={styles.field}>
            <label htmlFor="report-photo">{t('create.photo')}</label>
            <input
              id="report-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          {photoName ? (
            <p className={styles.photoChosen}>
              {t('create.selected', { name: photoName })}{' '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={skipPhoto}
              >
                {t('create.remove')}
              </button>
            </p>
          ) : (
            <p className={styles.hint}>{t('create.noPhoto')}</p>
          )}
        </fieldset>

        <fieldset className={styles.section}>
          <legend>{t('create.section4')}</legend>
          <div className={styles.field}>
            <label htmlFor="report-phone">{t('create.contactPhone')}</label>
            <input
              id="report-phone"
              value={fields.contactPhone}
              onChange={(e) => setField('contactPhone', e.target.value)}
            />
            {errors.contactPhone ? (
              <p role="alert" className={styles.error}>
                {err(errors.contactPhone)}
              </p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="report-email">{t('create.contactEmail')}</label>
            <input
              id="report-email"
              value={fields.contactEmail}
              onChange={(e) => setField('contactEmail', e.target.value)}
            />
            {errors.contactEmail ? (
              <p role="alert" className={styles.error}>
                {err(errors.contactEmail)}
              </p>
            ) : null}
          </div>
        </fieldset>

        {errors.form ? (
          <p role="alert" className={styles.error}>
            {err(errors.form)}
          </p>
        ) : null}
        <button type="submit" disabled={submitting}>
          {submitting ? t('create.publishing') : t('create.publish')}
        </button>
      </form>
    </main>
  );
}
