const jwt = require('jsonwebtoken');

const auth = require('../../../src/middleware/auth');

// Mirrors the secret hardcoded in src/middleware/auth.js.
const SECRET = 'your-super-secret-key-that-should-not-be-hardcoded';

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth middleware', () => {
  let next;
  let res;

  beforeEach(() => {
    next = jest.fn();
    res = buildRes();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('rejects a request with no Authorization header', () => {
    const req = { headers: {} };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an empty Authorization header', () => {
    const req = { headers: { authorization: '' } };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid Bearer token and attaches the decoded payload', () => {
    const token = jwt.sign({ id: 7 }, SECRET, { expiresIn: 60 });
    const req = { headers: { authorization: `Bearer ${token}` } };

    auth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe(7);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a token signed with the wrong secret', () => {
    const token = jwt.sign({ id: 7 }, 'a-different-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ id: 7 }, SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${token}` } };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a bare token sent without the "Bearer " prefix', () => {
    // The middleware reads token.split(' ')[1], so a bare token yields undefined.
    const token = jwt.sign({ id: 7 }, SECRET, { expiresIn: 60 });
    const req = { headers: { authorization: token } };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
