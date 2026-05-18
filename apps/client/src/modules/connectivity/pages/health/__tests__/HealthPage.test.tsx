import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableHealthPage,
  TEST_BASE_URL,
} from '../__fixtures__/render-health-page.js';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  document.documentElement.removeAttribute('data-theme');
});
afterAll(() => server.close());

describe('HealthPage', () => {
  it('renders ok state when /health returns { status: "ok" }', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/health`, () =>
        HttpResponse.json({ status: 'ok' }),
      ),
    );
    render(renderableHealthPage());
    expect(screen.getByText('Checking connection…')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/API reachable/)).toBeInTheDocument(),
    );
  });

  it('renders error state when /health fails', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/health`, () =>
        HttpResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 }),
      ),
    );
    render(renderableHealthPage());
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/API unreachable/),
    );
  });

  it('toggles data-theme between light and dark', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/health`, () =>
        HttpResponse.json({ status: 'ok' }),
      ),
    );
    render(renderableHealthPage());
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute('data-theme', 'light'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
