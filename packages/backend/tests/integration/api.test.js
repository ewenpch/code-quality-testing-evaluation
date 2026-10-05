const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const request = require('supertest');

// The database module reads DB_PATH at load time, so point it at a throwaway
// file before anything requires it.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-integration-'));
process.env.DB_PATH = path.join(tmpDir, 'api.sqlite');

const db = require('../../src/db/database');
const app = require('../../src/server');

const bearer = (token) => `Bearer ${token}`;

describe('API integration', () => {
  let adminToken;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await db.connect();

    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
    adminToken = res.body.token;
  });

  afterAll(async () => {
    await db.closeConnection();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('POST /api/auth/register', () => {
    it('creates a user and returns a usable token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newcomer', password: 'pw12345', firstname: 'New', lastname: 'Comer' });

      expect(res.status).toBe(201);
      expect(res.body.auth).toBe(true);
      expect(typeof res.body.token).toBe('string');

      // The token must actually authenticate against a protected route.
      const protectedRes = await request(app).get('/api/auth/users').set('Authorization', bearer(res.body.token));
      expect(protectedRes.status).toBe(200);
    });

    it('rejects a duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'twin', password: 'pw12345', firstname: 'A', lastname: 'B' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'twin', password: 'pw12345', firstname: 'C', lastname: 'D' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Error creating user' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates the seeded admin account', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.auth).toBe(true);
      expect(res.body.user).toMatchObject({ username: 'admin', firstname: 'Admin', lastname: 'User' });
      expect(res.body.user.password).toBeUndefined();
    });

    it('returns 401 on a wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'nope' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ auth: false, token: null });
    });

    it('returns 404 for an unknown username', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'admin123' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'No user found.' });
    });
  });

  describe('authentication guard', () => {
    it.each([['/api/auth/users'], ['/api/auth/similar-usernames'], ['/api/products'], ['/api/products/1']])(
      'rejects %s without a token',
      async (url) => {
        const res = await request(app).get(url);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'No token provided' });
      }
    );

    it('rejects a token that was not signed by this server', async () => {
      const res = await request(app).get('/api/auth/users').set('Authorization', bearer('forged.token.value'));

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Failed to authenticate token' });
    });
  });

  describe('GET /api/auth/users', () => {
    it('lists users without exposing password hashes', async () => {
      const res = await request(app).get('/api/auth/users').set('Authorization', bearer(adminToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((u) => u.username === 'admin')).toBe(true);
      res.body.forEach((user) => expect(user.password).toBeUndefined());
    });
  });

  describe('GET /api/auth/similar-usernames', () => {
    it('reports the number of comparisons performed', async () => {
      const res = await request(app).get('/api/auth/similar-usernames').set('Authorization', bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('similar');
      expect(typeof res.body.totalComparisons).toBe('number');
    });
  });

  describe('products', () => {
    it('returns the seeded catalogue enriched with computed fields', async () => {
      const res = await request(app).get('/api/products').set('Authorization', bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('success');
      expect(res.body.data.map((p) => p.name)).toEqual(expect.arrayContaining(['Laptop', 'Smartphone', 'Headphones']));
      expect(res.body.data[0]).toHaveProperty('cheaperCount');
      expect(res.body.data[0]).toHaveProperty('avgPrice');
    });

    it('creates a product and makes it retrievable by id', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', bearer(adminToken))
        .send({ name: 'Keyboard', price: 49.9, stock: 7 });

      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ name: 'Keyboard', price: 49.9, stock: 7 });

      const fetched = await request(app)
        .get(`/api/products/${created.body.id}`)
        .set('Authorization', bearer(adminToken));

      expect(fetched.status).toBe(200);
      expect(fetched.body.data).toMatchObject({ id: created.body.id, name: 'Keyboard' });
    });

    it('updates the stock of an existing product', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', bearer(adminToken))
        .send({ name: 'Mouse', price: 19.9, stock: 3 });

      const patched = await request(app)
        .patch(`/api/products/${created.body.id}/stock`)
        .set('Authorization', bearer(adminToken))
        .send({ stock: 99 });

      expect(patched.status).toBe(200);
      expect(patched.body).toEqual({ success: true });

      const fetched = await request(app)
        .get(`/api/products/${created.body.id}`)
        .set('Authorization', bearer(adminToken));
      expect(fetched.body.data.stock).toBe(99);
    });

    it('returns 404 when updating the stock of an unknown product', async () => {
      const res = await request(app)
        .patch('/api/products/999999/stock')
        .set('Authorization', bearer(adminToken))
        .send({ stock: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Product not found' });
    });
  });

  describe('error handling', () => {
    it('returns 404 for an unknown route', async () => {
      const res = await request(app).get('/api/does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found' });
    });

    it('lets the product router error handler catch a thrown error', async () => {
      jest.spyOn(db, 'getDb').mockImplementation(() => {
        throw new Error('database exploded');
      });

      const res = await request(app).get('/api/products').set('Authorization', bearer(adminToken));

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Something went wrong!' });
    });

    it('routes a body-parser failure to the global error handler', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"username": ');

      expect(res.status).toBe(500);
      expect(res.text).toBe('Something broke!');
    });
  });
});
