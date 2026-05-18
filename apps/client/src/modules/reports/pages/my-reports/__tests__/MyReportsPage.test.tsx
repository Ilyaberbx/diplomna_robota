import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  renderableMyReportsPage,
  reportFixture,
  TEST_BASE_URL,
  TEST_USER_ID,
} from '../__fixtures__/render-my-reports-page.js';

const server = setupServer();

function meHandler() {
  return http.get(`${TEST_BASE_URL}/auth/me`, () =>
    HttpResponse.json({ id: TEST_USER_ID, email: 'me@test.com' }),
  );
}

function browseWith(...items: ReturnType<typeof reportFixture>[]) {
  return http.get(`${TEST_BASE_URL}/reports`, () =>
    HttpResponse.json({ items, page: 1, pageSize: 100, total: items.length }),
  );
}

function noCandidates() {
  return http.get(`${TEST_BASE_URL}/reports/:id/candidates`, () =>
    HttpResponse.json([]),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  window.localStorage.setItem('petfinder.auth.token', 'test-token');
});
afterEach(() => {
  server.resetHandlers();
  window.localStorage.clear();
});
afterAll(() => server.close());

describe('MyReportsPage', () => {
  it('shows a loading state before reports resolve', () => {
    server.use(meHandler(), browseWith(), noCandidates());
    render(renderableMyReportsPage());
    expect(screen.getByRole('status')).toHaveTextContent(/Loading your reports/i);
  });

  it('shows the empty state when the user has no reports', async () => {
    server.use(
      meHandler(),
      browseWith(reportFixture('someone-else', { reporterId: 'other' })),
      noCandidates(),
    );
    render(renderableMyReportsPage());
    await waitFor(() =>
      expect(
        screen.getByText(/haven't published any reports yet/i),
      ).toBeInTheDocument(),
    );
  });

  it('groups reports by status with a candidate-count badge', async () => {
    server.use(
      meHandler(),
      browseWith(
        reportFixture('lost-active', { kind: 'lost', status: 'active' }),
        reportFixture('done', { kind: 'lost', status: 'reunited' }),
        reportFixture('shut', { kind: 'found', status: 'closed' }),
      ),
      http.get(`${TEST_BASE_URL}/reports/lost-active/candidates`, () =>
        HttpResponse.json([
          { report: reportFixture('c1', { kind: 'found' }), distanceKm: 1, speciesMatch: true, daysApart: 0 },
          { report: reportFixture('c2', { kind: 'found' }), distanceKm: 2, speciesMatch: true, daysApart: 1 },
        ]),
      ),
      noCandidates(),
    );
    render(renderableMyReportsPage());

    const active = await screen.findByRole('heading', { name: 'Active' });
    const activeSection = active.closest('section') as HTMLElement;
    expect(within(activeSection).getByText('lost-active')).toBeInTheDocument();
    expect(within(activeSection).getByText('2 candidates')).toBeInTheDocument();

    const recovered = screen.getByRole('heading', {
      name: 'Reunited / Resolved',
    });
    expect(
      within(recovered.closest('section') as HTMLElement).getByText('done'),
    ).toBeInTheDocument();

    const closed = screen.getByRole('heading', { name: 'Closed' });
    expect(
      within(closed.closest('section') as HTMLElement).getByText('shut'),
    ).toBeInTheDocument();
  });

  it('closes an active report via the quick action and reloads', async () => {
    let closed = false;
    server.use(
      meHandler(),
      http.get(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({
          items: [
            reportFixture('r1', {
              kind: 'lost',
              status: closed ? 'closed' : 'active',
            }),
          ],
          page: 1,
          pageSize: 100,
          total: 1,
        }),
      ),
      http.post(`${TEST_BASE_URL}/reports/r1/status`, async () => {
        closed = true;
        return HttpResponse.json({
          ...reportFixture('r1', { status: 'closed' }),
          viewer: 'owner',
          contactPhone: null,
          contactEmail: null,
        });
      }),
      noCandidates(),
    );
    render(renderableMyReportsPage());

    const closeButton = await screen.findByRole('button', { name: 'Close' });
    await userEvent.click(closeButton);

    await waitFor(() =>
      expect(
        within(
          (screen.getByRole('heading', { name: 'Closed' }).closest(
            'section',
          ) as HTMLElement),
        ).getByText('r1'),
      ).toBeInTheDocument(),
    );
  });

  it('surfaces the reunited-needs-confirmed-match error inline', async () => {
    server.use(
      meHandler(),
      browseWith(reportFixture('r1', { kind: 'lost', status: 'active' })),
      http.post(`${TEST_BASE_URL}/reports/r1/status`, () =>
        HttpResponse.json(
          { error: { code: 'INVALID_TRANSITION' } },
          { status: 409 },
        ),
      ),
      noCandidates(),
    );
    render(renderableMyReportsPage());

    const reunite = await screen.findByRole('button', {
      name: 'Mark reunited',
    });
    await userEvent.click(reunite);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /needs a confirmed match/i,
      ),
    );
  });

  it('renders the error state when the feed fails', async () => {
    server.use(
      meHandler(),
      http.get(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 }),
      ),
      noCandidates(),
    );
    render(renderableMyReportsPage());
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Could not load your reports/i,
      ),
    );
  });
});
