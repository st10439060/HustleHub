import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './main.jsx';

const mockGigs = [
  {
    _id: 'g1',
    title: 'A polished landing page',
    description: 'I will design a thoughtful landing page for your next product launch.',
    category: 'Design',
    price: 120,
    deliveryDays: 7,
    freelancer: { name: 'Demo Freelancer' },
  },
];

const mockUser = {
  id: 'u1',
  name: 'Demo Client',
  email: 'client@example.com',
  role: 'client',
};

const fakeToken = 'fake-jwt-token';

function mockFetch(url, options = {}) {
  const body = options.body ? JSON.parse(options.body) : null;
  const headers = { 'Content-Type': 'application/json' };

  if (url.endsWith('/api/gigs')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, gigs: mockGigs }) });
  }

  if (url.endsWith('/api/auth/login')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, token: fakeToken, user: mockUser }) });
  }

  if (url.endsWith('/api/bookings')) {
    if (options.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            booking: { _id: 'b1', gig: { title: mockGigs[0].title }, freelancer: { name: 'Demo Freelancer' }, status: 'pending', amount: 120 },
            transaction: { status: 'paid', amount: 120 },
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, bookings: [] }) });
  }

  return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
}

describe('HustleHub+ marketplace', () => {
  let originalFetch;
  let originalPrompt;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalPrompt = window.prompt;
    global.fetch = vi.fn(mockFetch);
    window.prompt = () => 'Please use the supplied brand direction.';
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.prompt = originalPrompt;
    localStorage.clear();
  });

  it('renders the marketplace landing page with a hero and search bar', () => {
    render(<App />);
    expect(screen.getByText('Find the right people')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search services or skills')).toBeTruthy();
  });

  it('shows gig cards after loading from the API', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('A polished landing page')).toBeTruthy();
      expect(screen.getByText('I will design a thoughtful landing page for your next product launch.')).toBeTruthy();
    });
  });

  it('lets a user sign in and shows their role badge', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Sign in'));
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(emailInput, { target: { value: 'client@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Str0ng!Pass' } });
    const form = emailInput.closest('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('client')).toBeTruthy();
      expect(localStorage.getItem('hustlehub_token')).toBe(fakeToken);
    });
  });

  it('lets a signed-in client book a gig and shows a confirmation', async () => {
    localStorage.setItem('hustlehub_token', fakeToken);
    localStorage.setItem('hustlehub_user', JSON.stringify(mockUser));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('A polished landing page')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Book this service'));

    await waitFor(() => {
      expect(screen.getByText(/Booking confirmed/)).toBeTruthy();
    });
  });
});
