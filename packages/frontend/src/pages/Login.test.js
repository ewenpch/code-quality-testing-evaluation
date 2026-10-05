import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { loginUser } from '../services/api';
import Login from './Login';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../services/api');

const renderLogin = (onLogin = jest.fn()) => {
  render(
    <MemoryRouter>
      <Login onLogin={onLogin} />
    </MemoryRouter>
  );
};

const fillAndSubmit = async (user, username, password) => {
  await user.type(screen.getByPlaceholderText('Username'), username);
  await user.type(screen.getByPlaceholderText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Login' }));
};

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the credentials form and a link to registration', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('keeps the typed credentials in the inputs', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Username'), 'jane');

    expect(screen.getByPlaceholderText('Username')).toHaveValue('jane');
  });

  it('signs the user in, notifies the parent and redirects', async () => {
    const user = userEvent.setup();
    loginUser.mockResolvedValue({ auth: true, token: 'tok-123' });
    const onLogin = jest.fn();
    renderLogin(onLogin);

    await fillAndSubmit(user, 'jane', 'secret');

    expect(loginUser).toHaveBeenCalledWith('jane', 'secret');
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('shows the server error and stays on the page', async () => {
    const user = userEvent.setup();
    loginUser.mockRejectedValue({ error: 'Bad credentials' });
    const onLogin = jest.fn();
    renderLogin(onLogin);

    await fillAndSubmit(user, 'jane', 'wrong');

    expect(await screen.findByText('Bad credentials')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the failure carries no error field', async () => {
    const user = userEvent.setup();
    loginUser.mockRejectedValue({});
    renderLogin();

    await fillAndSubmit(user, 'jane', 'wrong');

    expect(await screen.findByText('An error occurred')).toBeInTheDocument();
  });

  it('submits empty credentials without client-side validation', async () => {
    // Documents current behaviour: the form has no required-field guard.
    const user = userEvent.setup();
    loginUser.mockResolvedValue({});
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(loginUser).toHaveBeenCalledWith('', '');
  });
});
