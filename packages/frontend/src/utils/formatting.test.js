import { formatDate, formatPrice, formatSearchTerm, formatStock, formatUserName } from './formatting';

describe('formatDate', () => {
  it.each([[null], [undefined], ['']])('returns "Invalid Date" for %p', (value) => {
    expect(formatDate(value)).toBe('Invalid Date');
  });

  it('formats a Date as D/M/YYYY', () => {
    // Built from local parts so the assertion is timezone-independent.
    expect(formatDate(new Date(2024, 2, 15))).toBe('15/3/2024');
  });

  it('does not zero-pad single-digit days and months', () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe('5/1/2024');
  });

  it('accepts a timestamp', () => {
    const timestamp = new Date(2023, 11, 25).getTime();

    expect(formatDate(timestamp)).toBe('25/12/2023');
  });

  // Pins down behaviour that looks unintended; see the notes handed over
  // with this test suite.
  it('currently returns "NaN/NaN/NaN" for an unparseable date string', () => {
    expect(formatDate('not-a-date')).toBe('NaN/NaN/NaN');
  });
});

describe('formatPrice', () => {
  it.each([[null], [undefined], [''], [0]])('returns "$0.00" for %p', (value) => {
    expect(formatPrice(value)).toBe('$0.00');
  });

  it('returns "$0.00" for a non-numeric string', () => {
    expect(formatPrice('abc')).toBe('$0.00');
  });

  it('always shows two decimals', () => {
    expect(formatPrice(5)).toBe('$5.00');
    expect(formatPrice(5.1)).toBe('$5.10');
  });

  it('rounds to two decimals', () => {
    expect(formatPrice(9.999)).toBe('$10.00');
  });

  it('groups thousands with commas', () => {
    expect(formatPrice(1234.5)).toBe('$1,234.50');
    expect(formatPrice(1234567.891)).toBe('$1,234,567.89');
  });

  it('accepts a numeric string', () => {
    expect(formatPrice('1234.5')).toBe('$1,234.50');
  });
});

describe('formatStock', () => {
  it.each([
    [0, 'Out of Stock'],
    ['abc', 'Out of Stock'],
    [1, 'Low Stock (1 left)'],
    [4, 'Low Stock (4 left)'],
    [5, 'Limited Stock (5 available)'],
    [9, 'Limited Stock (9 available)'],
    [10, 'In Stock (10)'],
    ['12', 'In Stock (12)']
  ])('formats %p as %s', (input, expected) => {
    expect(formatStock(input)).toBe(expected);
  });
});

describe('formatUserName', () => {
  it('capitalises and joins both names', () => {
    expect(formatUserName('jane', 'doe')).toBe('Jane Doe');
  });

  it('trims surrounding whitespace', () => {
    expect(formatUserName('  jane  ', '  doe  ')).toBe('Jane Doe');
  });

  it('falls back to the first name alone', () => {
    expect(formatUserName('jane', null)).toBe('Jane');
  });

  it('falls back to the last name alone', () => {
    expect(formatUserName(null, 'doe')).toBe('Doe');
  });

  it('returns "Unknown User" when both names are missing', () => {
    expect(formatUserName(null, null)).toBe('Unknown User');
  });

  it('returns "Unknown User" when both names are only whitespace', () => {
    expect(formatUserName('   ', '   ')).toBe('Unknown User');
  });

  it('leaves an already-capitalised name untouched', () => {
    expect(formatUserName('Jane', 'Doe')).toBe('Jane Doe');
  });
});

describe('formatSearchTerm', () => {
  it('returns an empty string for a falsy term', () => {
    expect(formatSearchTerm('')).toBe('');
    expect(formatSearchTerm(null)).toBe('');
  });

  it('title-cases each word', () => {
    expect(formatSearchTerm('hello world')).toBe('Hello World');
  });

  it('collapses repeated spaces', () => {
    expect(formatSearchTerm('  multiple   spaces here ')).toBe('Multiple Spaces Here');
  });

  it('lowercases the rest of each word', () => {
    expect(formatSearchTerm('ALLCAPS TEXT')).toBe('Allcaps Text');
  });
});
