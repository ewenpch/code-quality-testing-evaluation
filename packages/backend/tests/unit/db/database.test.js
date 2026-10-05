const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const allRows = (handle, sql) =>
  new Promise((resolve, reject) => {
    handle.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });

describe('db/database', () => {
  let tmpDir;
  let dbPath;
  let database;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-module-test-'));
    dbPath = path.join(tmpDir, 'test.sqlite');
    process.env.DB_PATH = dbPath;
    // DB_PATH is read at module load, so the module must be re-required per test.
    jest.resetModules();
    database = require('../../../src/db/database');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await database.closeConnection().catch(() => {});
    delete process.env.DB_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws a helpful error when getDb is called before connect', () => {
    expect(() => database.getDb()).toThrow('Database not connected. Call connect() first.');
  });

  it('creates the database file and runs the migrations on connect', async () => {
    const handle = await database.connect();

    expect(handle).toBeDefined();
    expect(fs.existsSync(dbPath)).toBe(true);

    const tables = await allRows(handle, "SELECT name FROM sqlite_master WHERE type = 'table'");
    const names = tables.map((t) => t.name);
    expect(names).toContain('users');
    expect(names).toContain('products');
  });

  it('exposes the live handle through getDb once connected', async () => {
    const handle = await database.connect();

    expect(database.getDb()).toBe(handle);
  });

  it('reuses the existing connection instead of opening a second one', async () => {
    const first = await database.connect();
    const second = await database.connect();

    expect(second).toBe(first);
  });

  it('reports the file size when reconnecting to an existing database file', async () => {
    await database.connect();
    await database.closeConnection();

    // The file now exists, which exercises the stat/readdir branch of connect().
    await database.connect();

    expect(console.log).toHaveBeenCalledWith('Database file size:', expect.any(Number), 'bytes');
  });

  it('resolves closeConnection when nothing is connected', async () => {
    await expect(database.closeConnection()).resolves.toBeUndefined();
  });

  it('releases the handle so getDb throws again after close', async () => {
    await database.connect();
    await database.closeConnection();

    expect(() => database.getDb()).toThrow('Database not connected');
  });

  it('rejects when the database file cannot be opened', async () => {
    process.env.DB_PATH = path.join(tmpDir, 'missing-directory', 'test.sqlite');
    jest.resetModules();
    const broken = require('../../../src/db/database');
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(broken.connect()).rejects.toThrow();
  });
});
