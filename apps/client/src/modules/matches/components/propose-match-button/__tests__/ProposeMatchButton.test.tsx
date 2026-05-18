import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableProposeMatchButton,
  TEST_BASE_URL,
} from '../__fixtures__/render-propose-match-button.js';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProposeMatchButton', () => {
  it('proposes a match and shows the proposed confirmation', async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/matches`, () =>
        HttpResponse.json({
          id: 'm1',
          lostReportId: 'lost-1',
          foundReportId: 'found-1',
          proposedBy: 'u1',
          status: 'proposed',
          createdAt: '2026-05-02T00:00:00.000Z',
          resolvedAt: null,
        }),
      ),
    );
    render(renderableProposeMatchButton());

    await userEvent.click(
      screen.getByRole('button', { name: /propose a match/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/match proposed/i)).toBeInTheDocument(),
    );
  });

  it('surfaces a Forbidden error from the server', async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/matches`, () =>
        HttpResponse.json(
          { error: { code: 'FORBIDDEN' } },
          { status: 403 },
        ),
      ),
    );
    render(renderableProposeMatchButton());

    await userEvent.click(
      screen.getByRole('button', { name: /propose a match/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /could not propose this match/i,
      ),
    );
  });
});
