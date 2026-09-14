import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { getUsers } from '../services/api';
import UserList from './UserList';

jest.mock('../services/api');

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const users = [
  { id: 1, firstname: 'Alice', lastname: 'Adams', username: 'alice', created_at: daysAgo(2) },
  { id: 2, firstname: 'Bob', lastname: 'Brown', username: 'bob', created_at: daysAgo(15) },
  { id: 3, firstname: 'Carol', lastname: 'Clark', username: 'carol', created_at: daysAgo(100) }
];

const visibleNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('UserList page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getUsers.mockResolvedValue(users);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads and lists the users sorted by name', async () => {
    render(<UserList />);

    await screen.findByText('@alice');
    expect(visibleNames()).toEqual(['Alice Adams', 'Bob Brown', 'Carol Clark']);
    expect(getUsers).toHaveBeenCalledTimes(1);
  });

  it('shows an error banner when loading fails', async () => {
    getUsers.mockRejectedValue(new Error('Network Error'));

    render(<UserList />);

    expect(await screen.findByText('Failed to load users')).toBeInTheDocument();
  });

  it('filters the list from the search box', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    await screen.findByText('@alice');

    await user.type(screen.getByPlaceholderText('Search users...'), 'alice');

    await waitFor(() => expect(visibleNames()).toEqual(['Alice Adams']));
  });

  it('shows the empty state when the search matches nothing', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    await screen.findByText('@alice');

    await user.type(screen.getByPlaceholderText('Search users...'), 'zzzzzzzzzz');

    expect(await screen.findByText('No users found matching your criteria')).toBeInTheDocument();
  });

  it.each([
    ['week', ['Alice Adams']],
    ['month', ['Bob Brown']],
    ['older', ['Carol Clark']]
  ])('filters on the %s join window', async (window, expected) => {
    const user = userEvent.setup();
    render(<UserList />);
    await screen.findByText('@alice');

    await user.selectOptions(screen.getAllByRole('combobox')[0], window);

    await waitFor(() => expect(visibleNames()).toEqual(expected));
  });

  it('reverses the order when the direction button is pressed', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    await screen.findByText('@alice');

    await user.click(screen.getByRole('button', { name: '↑' }));

    await waitFor(() => expect(visibleNames()).toEqual(['Carol Clark', 'Bob Brown', 'Alice Adams']));
    expect(screen.getByRole('button', { name: '↓' })).toBeInTheDocument();
  });

  it('sorts by join date, oldest first', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    await screen.findByText('@alice');

    await user.selectOptions(screen.getAllByRole('combobox')[1], 'joined');

    await waitFor(() => expect(visibleNames()).toEqual(['Carol Clark', 'Bob Brown', 'Alice Adams']));
  });

  it('sorts by username', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    await screen.findByText('@alice');

    await user.selectOptions(screen.getAllByRole('combobox')[1], 'username');

    await waitFor(() => expect(visibleNames()).toEqual(['Alice Adams', 'Bob Brown', 'Carol Clark']));
  });

  it('renders an empty list without crashing', async () => {
    getUsers.mockResolvedValue([]);

    render(<UserList />);

    expect(await screen.findByText('No users found matching your criteria')).toBeInTheDocument();
  });
});
