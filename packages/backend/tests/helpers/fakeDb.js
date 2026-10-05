/**
 * Minimal stand-in for a node-sqlite3 Database handle.
 *
 * The controllers rely on sqlite3 calling `run` callbacks with `this` bound to a
 * statement object exposing `lastID` / `changes`, so the fake invokes callbacks
 * the same way. Each method is a jest.fn, so tests can override per case.
 */
const createFakeDb = ({ lastID = 1, changes = 1 } = {}) => ({
  run: jest.fn((sql, params, cb) => {
    if (cb) cb.call({ lastID, changes }, null);
  }),
  get: jest.fn((sql, params, cb) => {
    if (cb) cb.call({}, null, undefined);
  }),
  all: jest.fn((sql, params, cb) => {
    if (cb) cb.call({}, null, []);
  })
});

/** Express `res` double: status/json/send are chainable jest.fn()s. */
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

module.exports = { createFakeDb, createRes };
