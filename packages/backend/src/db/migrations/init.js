const bcrypt = require('bcryptjs');

const initDatabase = (db) => {
  const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, (err) => (err ? reject(err) : resolve()));
    });

  const get = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

  // Every step is awaited so the returned promise settles only once the schema
  // and the seed data are actually in place.
  const migrate = async () => {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstname TEXT,
        lastname TEXT,
        username TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME
      )
    `);

    const userCount = await get('SELECT COUNT(*) as count FROM users');

    if (userCount.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 8);

      await run(
        `
        INSERT INTO users (firstname, lastname, username, password)
        VALUES (?, ?, ?, ?)
      `,
        ['Admin', 'User', 'admin', hashedPassword]
      );
    }

    const productCount = await get('SELECT COUNT(*) as count FROM products');

    if (productCount.count === 0) {
      const sampleProducts = [
        ['Laptop', 999.99, 10],
        ['Smartphone', 499.99, 15],
        ['Headphones', 79.99, 20]
      ];

      for (const [name, price, stock] of sampleProducts) {
        await run('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)', [name, price, stock]);
      }
    }
  };

  return migrate().catch((err) => {
    console.error('Error initializing database:', err);
    throw err;
  });
};

module.exports = initDatabase;
