import { act, render, screen } from '@testing-library/react';
import React from 'react';

import App from './App';
import { getProducts, getUsers } from './services/api';

jest.mock('./services/api');

describe('App routing and authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/');
    getProducts.mockResolvedValue([]);
    getUsers.mockResolvedValue([]);
  });

  it('sends an anonymous visitor to the login page', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('hides the navigation bar while signed out', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Login' });

    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('sends an authenticated visitor to the product catalogue', async () => {
    localStorage.setItem('token', 'tok-123');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('serves the registration route', async () => {
    window.history.pushState({}, '', '/register');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Register' })).toBeInTheDocument();
  });

  it('serves the users route', async () => {
    localStorage.setItem('token', 'tok-123');
    window.history.pushState({}, '', '/users');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });

  it('serves the add-product route', async () => {
    localStorage.setItem('token', 'tok-123');
    window.history.pushState({}, '', '/add-product');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Add New Product' })).toBeInTheDocument();
  });

  it('picks up a session opened in another tab', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Login' });

    localStorage.setItem('token', 'tok-123');
    act(() => {
      window.dispatchEvent(new StorageEvent('storage'));
    });

    expect(await screen.findByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('drops the navigation bar when the session is cleared elsewhere', async () => {
    localStorage.setItem('token', 'tok-123');
    render(<App />);
    await screen.findByRole('button', { name: 'Logout' });

    localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage'));
    });

    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });
});
