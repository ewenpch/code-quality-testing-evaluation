import '@testing-library/jest-dom';

/*
 * jsdom does not implement `window.matchMedia`, so it is `undefined` in tests.
 * `useTheme` already guards against a missing implementation, but supplying a
 * minimal stub keeps the default (light mode) predictable and gives tests
 * something to spy on when they need to assert `prefers-color-scheme: dark`.
 */
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media) => ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })
  });
}
