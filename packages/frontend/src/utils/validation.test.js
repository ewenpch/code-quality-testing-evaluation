import { validateEmail, validatePassword, validateProduct, validateUser } from './validation';

describe('validateEmail', () => {
  it.each(['user@example.com', 'first.last@sub.domain.co', 'a_b-c@example.io', 'user@[192.168.1.1]'])(
    'accepts %s',
    (email) => {
      expect(validateEmail(email)).toBe(true);
    }
  );

  it.each(['', 'nope', 'a@b', '@example.com', 'user@', 'user@@example.com', 'user name@example.com'])(
    'rejects %s',
    (email) => {
      expect(validateEmail(email)).toBe(false);
    }
  );
});

describe('validatePassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(validatePassword('Passw0rd')).toEqual({ isValid: true, errors: [] });
  });

  it('reports every unmet rule at once', () => {
    const result = validatePassword('short');

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'Password must be at least 8 characters',
      'Password must contain uppercase',
      'Password must contain number'
    ]);
  });

  it('requires an uppercase letter', () => {
    expect(validatePassword('lowercase1').errors).toEqual(['Password must contain uppercase']);
  });

  it('requires a lowercase letter', () => {
    expect(validatePassword('UPPERCASE1').errors).toEqual(['Password must contain lowercase']);
  });

  it('requires a digit', () => {
    expect(validatePassword('NoDigitsHere').errors).toEqual(['Password must contain number']);
  });

  it('accepts a password of exactly eight characters', () => {
    expect(validatePassword('Abcdefg1').isValid).toBe(true);
  });
});

describe('validateUser', () => {
  const validUser = { firstname: 'Jane', lastname: 'Doe', username: 'jane', password: 'Passw0rd' };

  it('accepts a complete, well-formed user', () => {
    expect(validateUser(validUser)).toEqual({ isValid: true, errors: {} });
  });

  it('requires firstname, lastname and username', () => {
    const result = validateUser({ password: 'Passw0rd' });

    expect(result.isValid).toBe(false);
    expect(result.errors).toMatchObject({
      firstname: 'First name is required',
      lastname: 'Last name is required',
      username: 'Username is required'
    });
  });

  it('rejects a username shorter than three characters', () => {
    const result = validateUser({ ...validUser, username: 'ab' });

    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBe('Username too short');
  });

  it('reports a missing password as a string', () => {
    const result = validateUser({ ...validUser, password: '' });

    expect(result.errors.password).toBe('Password is required');
  });

  it('reports a weak password as the list of unmet rules', () => {
    const result = validateUser({ ...validUser, password: 'weak' });

    expect(result.isValid).toBe(false);
    expect(Array.isArray(result.errors.password)).toBe(true);
    expect(result.errors.password).toContain('Password must be at least 8 characters');
  });
});

describe('validateProduct', () => {
  it('accepts a well-formed product', () => {
    expect(validateProduct({ name: 'Laptop', price: 999.99, stock: 10 })).toEqual({ valid: true, errors: {} });
  });

  it('rejects a missing name', () => {
    const result = validateProduct({ price: 10, stock: 1 });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Name is required');
  });

  it('rejects a whitespace-only name', () => {
    const result = validateProduct({ name: '   ', price: 10, stock: 1 });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Name is required');
  });

  it('rejects a non-numeric price', () => {
    const result = validateProduct({ name: 'Laptop', price: 'abc', stock: 1 });

    expect(result.valid).toBe(false);
    expect(result.errors.price).toBe('Valid price is required');
  });

  it('rejects a negative price', () => {
    const result = validateProduct({ name: 'Laptop', price: -5, stock: 1 });

    expect(result.valid).toBe(false);
    expect(result.errors.price).toBe('Price must be positive');
  });

  it('rejects a non-numeric stock', () => {
    const result = validateProduct({ name: 'Laptop', price: 10, stock: 'abc' });

    expect(result.valid).toBe(false);
    expect(result.errors.stock).toEqual(['Stock must be a number']);
  });

  // The two cases below pin down behaviour that looks unintended; see the
  // notes handed over with this test suite.
  it('currently treats a zero price and zero stock as invalid', () => {
    const result = validateProduct({ name: 'Laptop', price: 0, stock: 0 });

    expect(result.valid).toBe(false);
    expect(result.errors.price).toBe('Valid price is required');
    expect(result.errors.stock).toEqual(['Stock must be a number']);
  });

  it('currently flags a negative stock without marking the product invalid', () => {
    const result = validateProduct({ name: 'Laptop', price: 10, stock: -5 });

    expect(result.errors.stock).toEqual(['Stock cannot be negative']);
    expect(result.valid).toBe(true);
  });
});
