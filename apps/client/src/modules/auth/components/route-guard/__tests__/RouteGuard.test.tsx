import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  renderableAuthApp,
  TEST_BASE_URL,
} from '../__fixtures__/render-auth-app.js';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  window.localStorage.removeItem('petfinder.auth.token');
});
afterAll(() => server.close());

describe('auth route guard + session', () => {
  it('redirects an anonymous visit to /me to /login?next=/me', async () => {
    render(renderableAuthApp('/me'));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument(),
    );
  });

  it('login stores the token, hydrates the user, and returns to ?next', async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/auth/login`, () =>
        HttpResponse.json({
          token: 'jwt-123',
          user: { id: 'u1', email: 'owner@example.com' },
        }),
      ),
    );
    render(renderableAuthApp('/login?next=%2Fme'));

    await userEvent.type(
      screen.getByLabelText('Email'),
      'owner@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(
        screen.getByText('owner@example.com'),
      ).toBeInTheDocument(),
    );
    expect(window.localStorage.getItem('petfinder.auth.token')).toBe(
      'jwt-123',
    );
  });

  it('a stored token hydrates the session from /auth/me', async () => {
    window.localStorage.setItem('petfinder.auth.token', 'jwt-123');
    server.use(
      http.get(`${TEST_BASE_URL}/auth/me`, () =>
        HttpResponse.json({ id: 'u1', email: 'owner@example.com' }),
      ),
    );
    render(renderableAuthApp('/me'));
    await waitFor(() =>
      expect(
        screen.getByText('owner@example.com'),
      ).toBeInTheDocument(),
    );
  });

  it('register stores the token and returns to ?next', async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/auth/register`, () =>
        HttpResponse.json({
          token: 'jwt-new',
          user: { id: 'u2', email: 'finder@example.com' },
        }),
      ),
    );
    render(renderableAuthApp('/register?next=%2Fme'));

    await userEvent.type(
      screen.getByLabelText('Email'),
      'finder@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    await waitFor(() =>
      expect(
        screen.getByText('finder@example.com'),
      ).toBeInTheDocument(),
    );
    expect(window.localStorage.getItem('petfinder.auth.token')).toBe(
      'jwt-new',
    );
  });

  it('register surfaces the duplicate-email error', async () => {
    server.use(
      http.post(`${TEST_BASE_URL}/auth/register`, () =>
        HttpResponse.json(
          { error: { code: 'EMAIL_TAKEN' } },
          { status: 409 },
        ),
      ),
    );
    render(renderableAuthApp('/register'));

    await userEvent.type(
      screen.getByLabelText('Email'),
      'taken@example.com',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /already registered/,
      ),
    );
  });
});
