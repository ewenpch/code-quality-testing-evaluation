import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { logout } from '../services/api';
import Navigation from './Navigation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../services/api');

const renderNav = (props = {}) =>
  render(
    <MemoryRouter>
      <Navigation onLogout={jest.fn()} {...props} />
    </MemoryRouter>
  );

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // The greeting depends on the clock and on Math.random; pin both.
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('links to the users and products pages', () => {
    renderNav();

    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
  });

  it('greets the stored user by first name', () => {
    localStorage.setItem('user', JSON.stringify({ firstname: 'Jane' }));

    renderNav();

    expect(screen.getByText(/Good morning, Jane/)).toBeInTheDocument();
  });

  it('falls back to "User" when nothing is stored', () => {
    renderNav();

    expect(screen.getByText(/Good morning, User/)).toBeInTheDocument();
  });

  it.each([
    [9, 'morning'],
    [14, 'afternoon'],
    [20, 'evening']
  ])('greets with "%s" at hour %i', (hour, expected) => {
    Date.prototype.getHours.mockReturnValue(hour);

    renderNav();

    expect(screen.getByText(new RegExp(`Good ${expected},`))).toBeInTheDocument();
  });

  it('clears the session, notifies the parent and redirects on logout', async () => {
    const user = userEvent.setup();
    const onLogout = jest.fn();
    renderNav({ onLogout });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
