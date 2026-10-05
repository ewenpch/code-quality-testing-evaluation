const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const initDatabase = require('../../../src/db/migrations/init');

const allRows = (handle, sql) =>
  new Promise((resolve, reject) => {
    handle.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });

describe('db/migrations/init', () => {
  let handle;

  beforeEach(() => {
    handle = new sqlite3.Database(':memory:');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    handle.close();
  });

  it('creates the users and products tables', async () => {
    await initDatabase(handle);

    const tables = await allRows(handle, "SELECT name FROM sqlite_master WHERE type = 'table'");
    const names = tables.map((t) => t.name);
    expect(names).toContain('users');
    expect(names).toContain('products');
  });

  it('resolves only once the schema and seed data are queryable', async () => {
    // Regression guard: the promise used to settle before the statements ran.
    await initDatabase(handle);

    const [{ count }] = await allRows(handle, 'SELECT COUNT(*) as count FROM products');
    expect(count).toBe(3);
  });

  it('seeds an admin user whose password is hashed, not stored in clear', async () => {
    await initDatabase(handle);

    const users = await allRows(handle, 'SELECT * FROM users');
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('admin');
    expect(users[0].firstname).toBe('Admin');
    expect(users[0].password).not.toBe('admin123');
    expect(bcrypt.compareSync('admin123', users[0].password)).toBe(true);
  });

  it('seeds the three sample products', async () => {
    await initDatabase(handle);

    const products = await allRows(handle, 'SELECT * FROM products ORDER BY id');
    expect(products.map((p) => p.name)).toEqual(['Laptop', 'Smartphone', 'Headphones']);
    expect(products[0]).toMatchObject({ price: 999.99, stock: 10 });
  });

  it('is idempotent: a second run does not duplicate the seed data', async () => {
    await initDatabase(handle);
    await initDatabase(handle);

    const users = await allRows(handle, 'SELECT * FROM users');
    const products = await allRows(handle, 'SELECT * FROM products');
    expect(users).toHaveLength(1);
    expect(products).toHaveLength(3);
  });

  it('rejects when a table cannot be created', async () => {
    const brokenDb = {
      run: jest.fn((sql, params, cb) => cb(new Error('cannot create table'))),
      get: jest.fn()
    };

    await expect(initDatabase(brokenDb)).rejects.toThrow('cannot create table');
    expect(brokenDb.get).not.toHaveBeenCalled();
  });

  it('rejects when the seed-check query fails', async () => {
    const brokenDb = {
      run: jest.fn((sql, params, cb) => cb(null)),
      get: jest.fn((sql, params, cb) => cb(new Error('no such table: users')))
    };

    await expect(initDatabase(brokenDb)).rejects.toThrow('no such table: users');
  });

  it('skips seeding when the tables already contain rows', async () => {
    const brokenDb = {
      run: jest.fn((sql, params, cb) => cb(null)),
      get: jest.fn((sql, params, cb) => cb(null, { count: 5 }))
    };

    await initDatabase(brokenDb);

    // Only the two CREATE TABLE statements should have run.
    expect(brokenDb.run).toHaveBeenCalledTimes(2);
  });
});
