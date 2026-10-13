import { render, screen } from '@testing-library/react';
import React from 'react';

import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  // The spinner is purely presentational: it renders no text, so it exposes a
  // `status` role with an accessible label instead of relying on a markup
  // snapshot that would break on any styling change.
  it('exposes itself to assistive technology as a labelled status', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading');
  });

  it('accepts a custom label', () => {
    render(<LoadingSpinner label="Loading products" />);

    expect(screen.getByRole('status')).toHaveAccessibleName('Loading products');
  });

  it('renders without crashing', () => {
    expect(() => render(<LoadingSpinner />)).not.toThrow();
  });
});
