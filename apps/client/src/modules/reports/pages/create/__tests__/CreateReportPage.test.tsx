import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableCreateReportPage,
  TEST_BASE_URL,
} from '../__fixtures__/render-create-report-page.js';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CreateReportPage', () => {
  it('shows inline validation errors and does not submit an invalid form', async () => {
    render(renderableCreateReportPage());
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish report' }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0),
    );
    expect(
      screen.getByText(/Provide a phone or an email/),
    ).toBeInTheDocument();
  });

  it('deep-links the kind from the query and publishes a valid report', async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json(
          {
            id: 'new-1',
            kind: 'found',
            reporterId: 'u1',
            status: 'active',
            species: 'cat',
            breed: null,
            name: null,
            color: null,
            description: null,
            photoKey: null,
            lat: 1,
            lng: 2,
            eventDate: '2026-05-01T00:00:00.000Z',
            createdAt: '2026-05-01T00:00:00.000Z',
            updatedAt: '2026-05-01T00:00:00.000Z',
            viewer: 'owner',
            contactPhone: '+1999',
            contactEmail: null,
          },
          { status: 201 },
        ),
      ),
    );
    render(renderableCreateReportPage('/report/new?kind=found'));
    expect(
      screen.getByRole('heading', { name: /Report a found pet/ }),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Latitude'), '50.45');
    await userEvent.type(screen.getByLabelText('Longitude'), '30.52');
    await userEvent.type(
      screen.getByLabelText('Date last seen / found'),
      '2026-05-01',
    );
    await userEvent.type(
      screen.getByLabelText('Contact phone'),
      '+1999',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish report' }),
    );

    await waitFor(() =>
      expect(screen.getByText('Published')).toBeInTheDocument(),
    );
  });
});
