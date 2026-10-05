import React from 'react';

import { useTheme } from '../hooks/useTheme';

const SunIcon = () => (
  <svg
    aria-hidden="true"
    className="size-5"
    fill="none"
    focusable="false"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="4" />
    <path
      strokeLinecap="round"
      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    aria-hidden="true"
    className="size-5"
    fill="none"
    focusable="false"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

/**
 * Single control for the application theme.
 *
 * `variant="inverse"` is for placement on the dark navigation bar; the default
 * outline variant sits on the light page surface.
 *
 * The button is the only component that reads theme state, so there is only
 * ever one source of truth for the `<html class="dark">` side effect.
 */
const ThemeToggle = ({ variant = 'default' }) => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isDark}
      className={variant === 'inverse' ? 'btn-nav-inverse' : 'btn-outline'}
      onClick={toggleTheme}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

export default ThemeToggle;
