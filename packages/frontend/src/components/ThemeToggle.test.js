import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { DARK_MODE_CLASS, THEME_STORAGE_KEY } from '../hooks/useTheme';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
    document.documentElement.style.colorScheme = '';
  });

  it('offers to switch to dark mode while the light theme is active', () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole('button', { name: 'Switch to dark theme' });

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches to dark, persists the choice and updates the label', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveClass(DARK_MODE_CLASS);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches back to light on a second click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(document.documentElement).not.toHaveClass(DARK_MODE_CLASS);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('renders the inverse variant for the dark navigation bar', () => {
    render(<ThemeToggle variant="inverse" />);

    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toHaveClass('btn-nav-inverse');
  });

  it('marks the control as a button rather than a submit control', () => {
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toHaveAttribute('type', 'button');
  });
});
