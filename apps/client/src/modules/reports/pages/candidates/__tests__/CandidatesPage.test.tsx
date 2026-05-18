import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableCandidatesPage,
  TEST_BASE_URL,
} from '../__fixtures__/render-candidates-page.js';

const server = setupServer();

function report(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    kind: 'found',
    reporterId: 'u2',
    status: 'active',
    species: 'dog',
    breed: null,
    name: id,
    color: null,
    description: null,
    photoKey: null,
    lat: 1,
    lng: 2,
    eventDate: '2026-05-01T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CandidatesPage', () => {
  it('renders the ranked candidate list with the match signal', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports/r1/candidates`, () =>
        HttpResponse.json([
          {
            report: report('best'),
            distanceKm: 0.4,
            speciesMatch: true,
            daysApart: 0,
          },
          {
            report: report('far', { species: 'cat' }),
            distanceKm: 12.3,
            speciesMatch: false,
            daysApart: 4,
          },
        ]),
      ),
    );
    render(renderableCandidatesPage());

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('best')).toBeInTheDocument();
    expect(within(items[0]).getByText(/Same species/)).toBeInTheDocument();
    expect(within(items[0]).getByText(/Under 1 km away/)).toBeInTheDocument();
    expect(within(items[0]).getByText('Same day')).toBeInTheDocument();
    expect(
      within(items[1]).getByText(/Different species/),
    ).toBeInTheDocument();
    expect(within(items[1]).getByText(/12.3 km away/)).toBeInTheDocument();
  });

  it('shows the keep-checking empty state', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports/r1/candidates`, () =>
        HttpResponse.json([]),
      ),
    );
    render(renderableCandidatesPage());
    await waitFor(() =>
      expect(
        screen.getByText(/we'll keep checking/i),
      ).toBeInTheDocument(),
    );
  });

  it('renders the error state on a failure', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports/r1/candidates`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }),
      ),
    );
    render(renderableCandidatesPage());
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Could not load candidates/,
      ),
    );
  });
});
