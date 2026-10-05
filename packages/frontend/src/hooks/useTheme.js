import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'theme';
export const DARK_MODE_CLASS = 'dark';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const isTheme = (value) => value === 'light' || value === 'dark';

/**
 * Reads the user's explicit choice. Returns null when they have not chosen one,
 * in which case the OS preference wins.
 */
const readStoredTheme = () => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // Private browsing modes can throw on access; fall back to the OS setting.
    return null;
  }
};

/**
 * `matchMedia` is absent in jsdom and in some older browsers, so every call
 * site has to tolerate it being undefined.
 */
const prefersDark = () => {
  if (typeof window.matchMedia !== 'function') return false;

  return window.matchMedia(DARK_SCHEME_QUERY).matches;
};

const persistTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // A theme that cannot be persisted still applies for this session.
  }
};

/**
 * Mirrors the theme onto <html>. Everything else in the app re-colours through
 * the CSS custom properties declared in src/styles/index.css.
 */
const applyTheme = (theme) => {
  const root = document.documentElement;

  root.classList.toggle(DARK_MODE_CLASS, theme === 'dark');
  // Keeps native widgets (<select> menus, scrollbars, date pickers) in theme.
  root.style.colorScheme = theme;
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(() => readStoredTheme() ?? (prefersDark() ? 'dark' : 'light'));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Track OS changes only while the user has not made an explicit choice.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    if (readStoredTheme()) return undefined;

    const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);
    const handleChange = (event) => setThemeState(event.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((next) => {
    if (!isTheme(next)) return;

    setThemeState(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
};
