import { act, renderHook } from '@testing-library/react';

import { DARK_MODE_CLASS, THEME_STORAGE_KEY, useTheme } from './useTheme';

/**
 * Replaces window.matchMedia with a controllable stub and returns a helper that
 * fires the `change` event the hook subscribes to.
 */
const stubMatchMedia = (initialMatches) => {
  const listeners = new Set();

  const mediaQueryList = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_event, handler) => listeners.add(handler),
    removeEventListener: (_event, handler) => listeners.delete(handler),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  };

  window.matchMedia = jest.fn().mockReturnValue(mediaQueryList);

  return {
    mediaQueryList,
    listenerCount: () => listeners.size,
    emitChange: (matches) => {
      mediaQueryList.matches = matches;
      act(() => {
        listeners.forEach((handler) => handler({ matches, media: mediaQueryList.media }));
      });
    }
  };
};

const originalMatchMedia = window.matchMedia;

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('resolving the initial theme', () => {
    it('follows the OS when the user has made no choice', () => {
      stubMatchMedia(true);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('defaults to light when the OS prefers light', () => {
      stubMatchMedia(false);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
    });

    it('prefers a stored choice over the OS setting', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      stubMatchMedia(true);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
    });

    it('ignores a corrupted stored value and falls back to the OS', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse');
      stubMatchMedia(true);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('falls back to light when matchMedia is unavailable', () => {
      delete window.matchMedia;

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
    });
  });

  describe('applying the theme to the document', () => {
    it('adds the dark class and colour scheme when dark', () => {
      stubMatchMedia(true);

      renderHook(() => useTheme());

      expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('removes the dark class when light', () => {
      stubMatchMedia(true);
      const { unmount } = renderHook(() => useTheme());

      unmount();
      stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
      expect(document.documentElement).not.toHaveClass(DARK_MODE_CLASS);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('switches to dark, persists it and updates the document', () => {
      stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      act(() => result.current.toggleTheme());

      expect(result.current.theme).toBe('dark');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);
    });

    it('switches back to light on a second call', () => {
      stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      act(() => result.current.toggleTheme());
      act(() => result.current.toggleTheme());

      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
      expect(document.documentElement).not.toHaveClass(DARK_MODE_CLASS);
    });
  });

  describe('setTheme', () => {
    it('applies and persists an explicit theme', () => {
      stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      act(() => result.current.setTheme('dark'));

      expect(result.current.theme).toBe('dark');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);
    });

    it('ignores values outside the supported set', () => {
      stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      act(() => result.current.setTheme('neon'));

      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });
  });

  describe('tracking OS changes', () => {
    it('adopts the OS preference while no explicit choice is stored', () => {
      const media = stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');

      media.emitChange(true);

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);
    });

    it('ignores OS changes once the user has chosen a theme', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      const media = stubMatchMedia(false);
      const { result } = renderHook(() => useTheme());

      media.emitChange(true);

      expect(result.current.theme).toBe('light');
      expect(media.listenerCount()).toBe(0);
    });

    it('detaches its listener on unmount', () => {
      const media = stubMatchMedia(false);
      const { unmount } = renderHook(() => useTheme());

      expect(media.listenerCount()).toBe(1);

      unmount();

      expect(media.listenerCount()).toBe(0);
    });

    it('subscribes to nothing when matchMedia is unavailable', () => {
      delete window.matchMedia;

      expect(() => renderHook(() => useTheme())).not.toThrow();
    });
  });

  describe('when storage is unavailable', () => {
    it('still applies the theme for the current session', () => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      stubMatchMedia(false);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');

      act(() => result.current.toggleTheme());

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);

      setItem.mockRestore();
      getItem.mockRestore();
    });
  });
});
