import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableBrowsePage,
  TEST_BASE_URL,
} from '../__fixtures__/render-browse-page.js';

const server = setupServer();

const ITEM = {
  id: 'r1',
  kind: 'lost',
  reporterId: 'u1',
  status: 'active',
  species: 'dog',
  breed: 'Husky',
  name: 'Rex',
  color: 'grey',
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

describe('BrowsePage', () => {
  it('shows the loading state then renders cards from the API', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({ items: [ITEM], page: 1, pageSize: 20, total: 1 }),
      ),
    );
    render(renderableBrowsePage());
    expect(screen.getByText('Loading reports…')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Rex')).toBeInTheDocument(),
    );
  });

  it('renders the designed empty state when no items match', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
    );
    render(renderableBrowsePage());
    await waitFor(() =>
      expect(screen.getByText(/No reports match these filters/)).toBeInTheDocument(),
    );
  });

  it('renders the error state when the API fails', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 }),
      ),
    );
    render(renderableBrowsePage());
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Could not load/),
    );
  });

  it('reflects the kind filter into the URL (shareable/back-safe)', async () => {
    let lastUrl = '';
    server.use(
      http.get(`${TEST_BASE_URL}/reports`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json({
          items: [ITEM],
          page: 1,
          pageSize: 20,
          total: 1,
        });
      }),
    );
    render(renderableBrowsePage());
    await waitFor(() => expect(screen.getByText('Rex')).toBeInTheDocument());
    await userEvent.selectOptions(
      screen.getByLabelText('Kind'),
      'found',
    );
    await waitFor(() => expect(lastUrl).toContain('kind=found'));
    expect(lastUrl).toContain('page=1');
  });

  it('hydrates filters from the initial URL query', async () => {
    let lastUrl = '';
    server.use(
      http.get(`${TEST_BASE_URL}/reports`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json({
          items: [ITEM],
          page: 2,
          pageSize: 20,
          total: 40,
        });
      }),
    );
    render(renderableBrowsePage('/browse?kind=lost&species=dog&page=2'));
    await waitFor(() => expect(lastUrl).toContain('kind=lost'));
    expect(lastUrl).toContain('species=dog');
    expect(lastUrl).toContain('page=2');
  });
});
