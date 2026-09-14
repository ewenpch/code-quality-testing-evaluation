import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { registerUser } from '../services/api';
import Register from './Register';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../services/api');

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

const fillForm = async (user) => {
  await user.type(screen.getByPlaceholderText('First Name'), 'Jane');
  await user.type(screen.getByPlaceholderText('Last Name'), 'Doe');
  await user.type(screen.getByPlaceholderText('Username'), 'jane');
  await user.type(screen.getByPlaceholderText('Password'), 'Passw0rd');
};

describe('Register page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders every field and a link back to login', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    ['First Name', 'Last Name', 'Username', 'Password'].forEach((placeholder) => {
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('tracks each field independently through the shared change handler', async () => {
    const user = userEvent.setup();
    renderRegister();

    await fillForm(user);

    expect(screen.getByPlaceholderText('First Name')).toHaveValue('Jane');
    expect(screen.getByPlaceholderText('Last Name')).toHaveValue('Doe');
    expect(screen.getByPlaceholderText('Username')).toHaveValue('jane');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('Passw0rd');
  });

  it('submits the whole form payload and redirects on success', async () => {
    const user = userEvent.setup();
    registerUser.mockResolvedValue({ auth: true, token: 'tok-123' });
    renderRegister();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(registerUser).toHaveBeenCalledWith({
      firstname: 'Jane',
      lastname: 'Doe',
      username: 'jane',
      password: 'Passw0rd'
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/products'));
  });

  it('surfaces the server error message', async () => {
    const user = userEvent.setup();
    registerUser.mockRejectedValue({ response: { data: { error: 'Username already taken' } } });
    renderRegister();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Username already taken')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a network failure', async () => {
    const user = userEvent.setup();
    registerUser.mockRejectedValue(new Error('Network Error'));
    renderRegister();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });
});
