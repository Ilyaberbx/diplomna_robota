import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableMatchDetailPage,
  TEST_BASE_URL,
} from '../__fixtures__/render-match-detail-page.js';

const server = setupServer();

const MATCH = {
  id: 'm1',
  lostReportId: 'lost-1',
  foundReportId: 'found-1',
  proposedBy: 'owner',
  status: 'proposed' as const,
  createdAt: '2026-05-02T00:00:00.000Z',
  resolvedAt: null,
};

function ownerReport(id: string, phone: string, email: string) {
  return {
    id,
    kind: id === 'lost-1' ? 'lost' : 'found',
    reporterId: 'r',
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
    viewer: 'owner',
    contactPhone: phone,
    contactEmail: email,
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MatchDetailPage', () => {
  it('confirming a proposed match reveals both parties contact details', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/matches`, () =>
        HttpResponse.json([MATCH]),
      ),
      http.post(`${TEST_BASE_URL}/matches/m1/confirm`, () =>
        HttpResponse.json({
          ...MATCH,
          status: 'confirmed',
          resolvedAt: '2026-05-03T00:00:00.000Z',
          lostReport: ownerReport('lost-1', '+lost', 'owner@x.com'),
          foundReport: ownerReport('found-1', '+found', 'finder@x.com'),
        }),
      ),
    );
    render(renderableMatchDetailPage());

    await screen.findByRole('button', { name: /confirm match/i });
    await userEvent.click(
      screen.getByRole('button', { name: /confirm match/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: /revealed contact details/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/\+lost/)).toBeInTheDocument();
    expect(screen.getByText(/finder@x\.com/)).toBeInTheDocument();
    expect(
      screen.getByText(/because this match is confirmed/i),
    ).toBeInTheDocument();
  });

  it('shows no contact panel while the match is only proposed', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/matches`, () =>
        HttpResponse.json([MATCH]),
      ),
    );
    render(renderableMatchDetailPage());

    await screen.findByRole('button', { name: /confirm match/i });
    expect(
      screen.queryByRole('region', { name: /revealed contact details/i }),
    ).not.toBeInTheDocument();
  });
});
