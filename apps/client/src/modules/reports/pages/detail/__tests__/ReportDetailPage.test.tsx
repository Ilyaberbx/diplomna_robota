import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableReportDetailPage,
  TEST_BASE_URL,
} from '../__fixtures__/render-report-detail-page.js';

const server = setupServer();

const BASE = {
  id: 'r1',
  kind: 'lost',
  reporterId: 'u1',
  status: 'active',
  species: 'dog',
  breed: null,
  name: 'Rex',
  color: null,
  description: null,
  photoKey: null,
  lat: 1,
  lng: 2,
  eventDate: '2026-05-01T00:00:00.000Z',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportDetailPage projection switch', () => {
  it('hides contact for the public projection', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports/r1`, () =>
        HttpResponse.json({ ...BASE, viewer: 'public' }),
      ),
    );
    render(renderableReportDetailPage());
    await waitFor(() =>
      expect(
        screen.getByText(/Contact details are hidden/),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Your contact details/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /View candidates/ }),
    ).not.toBeInTheDocument();
  });

  it('shows the contact panel for the owner projection', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports/r1`, () =>
        HttpResponse.json({
          ...BASE,
          viewer: 'owner',
          contactPhone: '+1999',
          contactEmail: 'me@owner.com',
        }),
      ),
    );
    render(renderableReportDetailPage());
    await waitFor(() =>
      expect(screen.getByText('me@owner.com', { exact: false })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Your contact details/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /View candidates/ }),
    ).toHaveAttribute('href', '/reports/r1/candidates');
  });

  it('renders the error state on a 404', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports/r1`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 }),
      ),
    );
    render(renderableReportDetailPage());
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Could not load/),
    );
  });
});
