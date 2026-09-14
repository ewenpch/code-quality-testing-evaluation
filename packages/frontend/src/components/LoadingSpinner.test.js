import { render } from '@testing-library/react';
import React from 'react';

import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  // The spinner is purely presentational: it renders no text and carries no
  // ARIA role, so there is nothing for a Testing Library query to target.
  // A snapshot is the only assertion available without changing the component.
  it('renders the spinner markup', () => {
    const { asFragment } = render(<LoadingSpinner />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('renders without crashing', () => {
    expect(() => render(<LoadingSpinner />)).not.toThrow();
  });
});
