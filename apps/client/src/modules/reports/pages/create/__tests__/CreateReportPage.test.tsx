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

const REPORT_RESPONSE = {
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
};

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

  it('photo step is explicitly skippable and publishes with no photo', async () => {
    let photoUploaded = false;
    server.use(
      http.post(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({ ...REPORT_RESPONSE, id: 'no-photo' }, { status: 201 }),
      ),
      http.post(`${TEST_BASE_URL}/reports/no-photo/photo`, () => {
        photoUploaded = true;
        return HttpResponse.json(REPORT_RESPONSE);
      }),
    );
    render(renderableCreateReportPage('/report/new?kind=found'));

    expect(
      screen.getByText(/You can skip this and add one later/),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Latitude'), '50.45');
    await userEvent.type(screen.getByLabelText('Longitude'), '30.52');
    await userEvent.type(
      screen.getByLabelText('Date last seen / found'),
      '2026-05-01',
    );
    await userEvent.type(screen.getByLabelText('Contact phone'), '+1999');
    await userEvent.click(
      screen.getByRole('button', { name: 'Publish report' }),
    );

    await waitFor(() =>
      expect(screen.getByText('Published')).toBeInTheDocument(),
    );
    expect(photoUploaded).toBe(false);
  });

  it('uploads the chosen photo after creating the report', async () => {
    let photoUploaded = false;
    server.use(
      http.post(`${TEST_BASE_URL}/reports`, () =>
        HttpResponse.json({ ...REPORT_RESPONSE, id: 'with-photo' }, { status: 201 }),
      ),
      http.post(`${TEST_BASE_URL}/reports/with-photo/photo`, () => {
        photoUploaded = true;
        return HttpResponse.json(REPORT_RESPONSE);
      }),
    );
    render(renderableCreateReportPage('/report/new?kind=found'));

    await userEvent.type(screen.getByLabelText('Latitude'), '50.45');
    await userEvent.type(screen.getByLabelText('Longitude'), '30.52');
    await userEvent.type(
      screen.getByLabelText('Date last seen / found'),
      '2026-05-01',
    );
    await userEvent.type(screen.getByLabelText('Contact phone'), '+1999');

    const file = new File([new Uint8Array([1, 2, 3])], 'pet.png', {
      type: 'image/png',
    });
    await userEvent.upload(screen.getByLabelText('Photo'), file);
    expect(screen.getByText(/Selected: pet.png/)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Publish report' }),
    );

    await waitFor(() =>
      expect(screen.getByText('Published')).toBeInTheDocument(),
    );
    expect(photoUploaded).toBe(true);
  });
});
