const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userController = require('../../../src/controllers/userController');
const db = require('../../../src/db/database');
const { createFakeDb, createRes } = require('../../helpers/fakeDb');

jest.mock('../../../src/db/database');

const SECRET = 'your-super-secret-key-that-should-not-be-hardcoded';

describe('userController', () => {
  let database;
  let res;

  beforeEach(() => {
    database = createFakeDb();
    db.getDb.mockReturnValue(database);
    res = createRes();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('registerUser', () => {
    it('hashes the password, inserts the user and returns a signed token', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({ lastID: 42 }, null));
      const req = { body: { username: 'jane', password: 'secret', firstname: 'Jane', lastname: 'Doe' } };

      userController.registerUser(req, res);

      const [sql, params] = database.run.mock.calls[0];
      expect(sql).toContain('INSERT INTO users');
      expect(params[0]).toBe('jane');
      // The stored value must be a hash, never the plaintext.
      expect(params[1]).not.toBe('secret');
      expect(bcrypt.compareSync('secret', params[1])).toBe(true);
      expect(params[2]).toBe('Jane');
      expect(params[3]).toBe('Doe');

      expect(res.status).toHaveBeenCalledWith(201);
      const payload = res.json.mock.calls[0][0];
      expect(payload.auth).toBe(true);
      // The token must identify the row sqlite just created.
      expect(jwt.verify(payload.token, SECRET).id).toBe(42);
    });

    it('returns 500 when the insert fails', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({}, new Error('UNIQUE constraint failed')));
      const req = { body: { username: 'jane', password: 'secret', firstname: 'Jane', lastname: 'Doe' } };

      userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error creating user' });
    });
  });

  describe('loginUser', () => {
    const existingUser = () => ({
      id: 3,
      username: 'jane',
      password: bcrypt.hashSync('secret', 8),
      firstname: 'Jane',
      lastname: 'Doe'
    });

    it('returns a token and the public user fields on valid credentials', () => {
      const user = existingUser();
      database.get = jest.fn((sql, params, cb) => cb(null, user));
      const req = { body: { username: 'jane', password: 'secret' } };

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.auth).toBe(true);
      expect(jwt.verify(payload.token, SECRET).id).toBe(3);
      expect(payload.user).toEqual({ id: 3, username: 'jane', firstname: 'Jane', lastname: 'Doe' });
      // The password hash must never leave the controller.
      expect(payload.user.password).toBeUndefined();
    });

    it('returns 401 without a token when the password is wrong', () => {
      database.get = jest.fn((sql, params, cb) => cb(null, existingUser()));
      const req = { body: { username: 'jane', password: 'wrong' } };

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ auth: false, token: null });
    });

    it('returns 404 when the username is unknown', () => {
      database.get = jest.fn((sql, params, cb) => cb(null, undefined));
      const req = { body: { username: 'ghost', password: 'secret' } };

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No user found.' });
    });

    it('returns 500 when the lookup fails', () => {
      database.get = jest.fn((sql, params, cb) => cb(new Error('disk I/O error')));
      const req = { body: { username: 'jane', password: 'secret' } };

      userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error on the server.' });
    });
  });

  describe('getAllUsers', () => {
    it('returns the rows and never selects the password column', () => {
      const rows = [{ id: 1, username: 'jane', firstname: 'Jane', lastname: 'Doe', created_at: '2024-01-01' }];
      database.all = jest.fn((sql, params, cb) => cb(null, rows));

      userController.getAllUsers({}, res);

      expect(database.all.mock.calls[0][0]).not.toContain('password');
      expect(res.json).toHaveBeenCalledWith(rows);
    });

    it('returns 500 when the query fails', () => {
      database.all = jest.fn((sql, params, cb) => cb(new Error('no such table')));

      userController.getAllUsers({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error getting users' });
    });
  });

  describe('findSimilarUsernames', () => {
    it('pairs usernames within a Levenshtein distance of 2', () => {
      database.all = jest.fn((sql, params, cb) =>
        cb(null, [{ username: 'alice' }, { username: 'alicia' }, { username: 'bob' }])
      );

      userController.findSimilarUsernames({}, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.totalComparisons).toBe(3);
      expect(payload.similar).toEqual([{ user1: 'alice', user2: 'alicia', distance: 2 }]);
    });

    it('compares case-insensitively', () => {
      database.all = jest.fn((sql, params, cb) => cb(null, [{ username: 'Jane' }, { username: 'jane' }]));

      userController.findSimilarUsernames({}, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.similar).toEqual([{ user1: 'Jane', user2: 'jane', distance: 0 }]);
    });

    it('returns an empty result for a single user', () => {
      database.all = jest.fn((sql, params, cb) => cb(null, [{ username: 'solo' }]));

      userController.findSimilarUsernames({}, res);

      expect(res.json).toHaveBeenCalledWith({ similar: [], totalComparisons: 0 });
    });

    it('returns 500 with the driver message when the query fails', () => {
      database.all = jest.fn((sql, params, cb) => cb(new Error('no such table: users')));

      userController.findSimilarUsernames({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'no such table: users' });
    });
  });
});
