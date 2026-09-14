import { act, renderHook, waitFor } from '@testing-library/react';

import { useAuth } from './useAuth';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with no user and finishes loading', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('restores the user from localStorage on mount', async () => {
    localStorage.setItem('token', 'tok-123');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'jane' }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ id: 1, username: 'jane' });
  });

  it('ignores a stored user when the token is missing', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('persists the session on login', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login('tok-456', { id: 2, username: 'john' });
    });

    expect(localStorage.getItem('token')).toBe('tok-456');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 2, username: 'john' });
    expect(result.current.user).toEqual({ id: 2, username: 'john' });
  });

  it('swallows a serialisation failure on login instead of crashing', async () => {
    const circular = {};
    circular.self = circular;
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.login('tok-789', circular);
    });

    expect(console.error).toHaveBeenCalledWith('Failed to save auth data:', expect.any(Error));
    expect(result.current.user).toBeNull();
  });

  it('clears the session and redirects on logout', async () => {
    localStorage.setItem('token', 'tok-123');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
