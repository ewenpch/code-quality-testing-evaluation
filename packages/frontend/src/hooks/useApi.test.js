import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';

import { useApi } from './useApi';

jest.mock('axios');

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('returns the response payload and leaves no error behind', async () => {
    axios.mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => useApi());

    let payload;
    await act(async () => {
      payload = await result.current.get('/things');
    });

    expect(payload).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('attaches the stored token as a Bearer header', async () => {
    localStorage.setItem('token', 'tok-123');
    axios.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/things');
    });

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/things',
        headers: { Authorization: 'Bearer tok-123' }
      })
    );
  });

  it('sends an undefined Authorization header when no token is stored', async () => {
    axios.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/things');
    });

    expect(axios.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('flips loading while the request is in flight', async () => {
    let release;
    axios.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ data: {} });
      })
    );
    const { result } = renderHook(() => useApi());

    let pending;
    act(() => {
      pending = result.current.get('/slow');
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      release();
      await pending;
    });

    expect(result.current.loading).toBe(false);
  });

  it('exposes the server error message and rethrows', async () => {
    axios.mockRejectedValue({ response: { data: { error: 'Forbidden' } } });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await expect(result.current.get('/denied')).rejects.toBeDefined();
    });

    expect(result.current.error).toBe('Forbidden');
    expect(result.current.loading).toBe(false);
  });

  it('falls back to a generic message when the error carries no payload', async () => {
    axios.mockRejectedValue(new Error('Network Error'));
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await expect(result.current.get('/denied')).rejects.toThrow('Network Error');
    });

    expect(result.current.error).toBe('An error occurred');
  });

  it.each([
    ['post', 'POST'],
    ['put', 'PUT']
  ])('%s sends the body with the %s verb', async (method, verb) => {
    axios.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current[method]('/things', { name: 'thing' });
    });

    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({ method: verb, url: '/things', data: { name: 'thing' } })
    );
  });

  it('delete sends the DELETE verb', async () => {
    axios.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.delete('/things/1');
    });

    expect(axios).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE', url: '/things/1' }));
  });
});
