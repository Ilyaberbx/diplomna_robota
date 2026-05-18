import { describe, expect, it } from 'vitest';
import { validateCreateReportForm } from '../create-report-form.utils.js';

const base = {
  kind: 'lost' as const,
  species: 'dog',
  name: 'Rex',
  breed: '',
  color: '',
  description: '',
  contactPhone: '+1999',
  contactEmail: '',
  lat: '50.45',
  lng: '30.52',
  eventDate: '2026-05-01',
};

describe('validateCreateReportForm', () => {
  it('accepts a valid form and normalises to the API input', () => {
    const result = validateCreateReportForm(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe('lost');
      expect(result.value.contactPhone).toBe('+1999');
      expect(result.value.eventDate).toBe('2026-05-01T00:00:00.000Z');
      expect(result.value.breed).toBeUndefined();
    }
  });

  it('requires at least a phone or an email', () => {
    const result = validateCreateReportForm({
      ...base,
      contactPhone: '',
      contactEmail: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.contactPhone).toBe('create.err.contactRequired');
  });

  it('rejects an out-of-range latitude', () => {
    const result = validateCreateReportForm({ ...base, lat: '999' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.lat).toBeDefined();
  });

  it('rejects a missing date', () => {
    const result = validateCreateReportForm({ ...base, eventDate: '' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.eventDate).toBe('create.err.dateRequired');
  });

  it('rejects a malformed email', () => {
    const result = validateCreateReportForm({
      ...base,
      contactEmail: 'not-an-email',
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.contactEmail).toBe('create.err.email');
  });
});
