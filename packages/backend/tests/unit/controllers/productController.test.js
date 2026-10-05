const productController = require('../../../src/controllers/productController');
const db = require('../../../src/db/database');
const { createFakeDb, createRes } = require('../../helpers/fakeDb');

jest.mock('../../../src/db/database');

/**
 * getAllProducts finishes asynchronously (it awaits one query per product), so
 * tests need a signal for "the controller has responded".
 */
const createDeferredRes = () => {
  let settle;
  const responded = new Promise((resolve) => {
    settle = resolve;
  });
  const res = createRes();
  res.json.mockImplementation((payload) => {
    settle(payload);
    return res;
  });
  return { res, responded };
};

describe('productController', () => {
  let database;

  beforeEach(() => {
    database = createFakeDb();
    db.getDb.mockReturnValue(database);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getAllProducts', () => {
    it('enriches every product with cheaperCount and avgPrice', async () => {
      const products = [
        { id: 1, name: 'Laptop', price: 999.99, stock: 10 },
        { id: 2, name: 'Headphones', price: 79.99, stock: 20 }
      ];
      database.all = jest.fn((sql, params, cb) => cb(null, products));
      database.get = jest.fn((sql, params, cb) => {
        if (sql.includes('COUNT(*)')) return cb(null, { total: params[0] > 100 ? 2 : 1 });
        return cb(null, { avg: 539.99 });
      });
      const { res, responded } = createDeferredRes();

      productController.getAllProducts({}, res);
      const payload = await responded;

      expect(payload.message).toBe('success');
      expect(payload.data).toHaveLength(2);
      expect(payload.data[0]).toMatchObject({ name: 'Laptop', cheaperCount: 2, avgPrice: 539.99 });
      expect(payload.data[1]).toMatchObject({ name: 'Headphones', cheaperCount: 1, avgPrice: 539.99 });
      // Two follow-up queries per product.
      expect(database.get).toHaveBeenCalledTimes(4);
    });

    it('leaves the enrichment fields unset when the follow-up queries fail', async () => {
      database.all = jest.fn((sql, params, cb) => cb(null, [{ id: 1, name: 'Laptop', price: 999.99 }]));
      database.get = jest.fn((sql, params, cb) => cb(new Error('query failed')));
      const { res, responded } = createDeferredRes();

      productController.getAllProducts({}, res);
      const payload = await responded;

      expect(payload.data[0].cheaperCount).toBeUndefined();
      expect(payload.data[0].avgPrice).toBeUndefined();
    });

    it('returns an empty list when there are no products', async () => {
      database.all = jest.fn((sql, params, cb) => cb(null, []));
      const { res, responded } = createDeferredRes();

      productController.getAllProducts({}, res);
      const payload = await responded;

      expect(payload).toEqual({ message: 'success', data: [] });
      expect(database.get).not.toHaveBeenCalled();
    });

    it('returns 400 with the driver message when the listing query fails', async () => {
      database.all = jest.fn((sql, params, cb) => cb(new Error('no such table: products')));
      const { res, responded } = createDeferredRes();

      productController.getAllProducts({}, res);
      await responded;

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'no such table: products' });
    });
  });

  describe('createProduct', () => {
    it('inserts the product and echoes it back with the new id', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({ lastID: 17 }, null));
      const res = createRes();
      const req = { body: { name: 'Monitor', price: 199.5, stock: 4 } };

      productController.createProduct(req, res);

      expect(database.run.mock.calls[0][1]).toEqual(['Monitor', 199.5, 4]);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 17, name: 'Monitor', price: 199.5, stock: 4 });
    });

    it('returns 500 when the insert fails', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({}, new Error('NOT NULL constraint failed')));
      const res = createRes();

      productController.createProduct({ body: { name: null, price: 1, stock: 1 } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error creating product' });
    });
  });

  describe('getProduct', () => {
    it('looks the product up by the id route param', () => {
      const product = { id: 5, name: 'Laptop', price: 999.99, stock: 10 };
      database.get = jest.fn((sql, params, cb) => cb(null, product));
      const res = createRes();

      productController.getProduct({ params: { id: '5' } }, res);

      expect(database.get.mock.calls[0][1]).toEqual(['5']);
      expect(res.json).toHaveBeenCalledWith({ message: 'success', data: product });
    });

    it('responds with a success envelope and undefined data for an unknown id', () => {
      // Documents current behaviour: a missing row is not a 404 here.
      database.get = jest.fn((sql, params, cb) => cb(null, undefined));
      const res = createRes();

      productController.getProduct({ params: { id: '999' } }, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'success', data: undefined });
    });

    it('returns 400 when the query fails', () => {
      database.get = jest.fn((sql, params, cb) => cb(new Error('disk I/O error')));
      const res = createRes();

      productController.getProduct({ params: { id: '5' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'disk I/O error' });
    });
  });

  describe('updateStock', () => {
    it('updates the stock and confirms success', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({ changes: 1 }, null));
      const res = createRes();

      productController.updateStock({ params: { id: '5' }, body: { stock: 42 } }, res);

      expect(database.run.mock.calls[0][1]).toEqual([42, '5']);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns 404 when no row matched the id', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({ changes: 0 }, null));
      const res = createRes();

      productController.updateStock({ params: { id: '999' }, body: { stock: 42 } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });

    it('returns 500 when the update fails', () => {
      database.run = jest.fn((sql, params, cb) => cb.call({}, new Error('database is locked')));
      const res = createRes();

      productController.updateStock({ params: { id: '5' }, body: { stock: 42 } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update stock' });
    });
  });
});
