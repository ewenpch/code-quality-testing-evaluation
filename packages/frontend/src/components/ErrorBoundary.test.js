import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ErrorBoundary from './ErrorBoundary';

const Boom = () => {
  throw new Error('child exploded');
};

describe('ErrorBoundary', () => {
  let originalLocation;

  beforeEach(() => {
    // React logs the caught error itself; keep the test output readable.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, reload: jest.fn() }
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation });
    jest.restoreAllMocks();
  });

  it('renders its children while nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('all good')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong!')).not.toBeInTheDocument();
  });

  it('shows the fallback and the error message when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    expect(screen.getByText('Error: child exploded')).toBeInTheDocument();
  });

  it('logs the caught error through componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(console.log).toHaveBeenCalledWith('Error caught:', expect.any(Error), expect.anything());
  });

  it('reloads the page when the recovery button is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: 'Reload Page' }));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
