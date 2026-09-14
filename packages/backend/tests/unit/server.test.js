const db = require('../../src/db/database');
const app = require('../../src/server');

jest.mock('../../src/db/database');

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const expectedPort = process.env.PORT || 3001;

describe('server bootstrap', () => {
  let fakeServer;
  let listenSpy;
  let exitSpy;
  let processOnSpy;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    processOnSpy = jest.spyOn(process, 'on');

    fakeServer = { on: jest.fn(), close: jest.fn((cb) => cb()) };
    listenSpy = jest.spyOn(app, 'listen').mockImplementation((port, cb) => {
      cb();
      return fakeServer;
    });
  });

  afterEach(() => {
    process.removeAllListeners('SIGTERM');
  });

  const sigtermHandler = () => processOnSpy.mock.calls.filter(([event]) => event === 'SIGTERM').pop()[1];

  it('connects the database before it starts listening', async () => {
    db.connect.mockResolvedValue({});

    await app.startServer();

    expect(db.connect).toHaveBeenCalledTimes(1);
    expect(listenSpy).toHaveBeenCalledWith(expectedPort, expect.any(Function));
    expect(fakeServer.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('exits without listening when the database is unreachable', async () => {
    db.connect.mockRejectedValue(new Error('database unreachable'));

    await app.startServer();

    expect(listenSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when the HTTP server emits an error', async () => {
    db.connect.mockResolvedValue({});
    await app.startServer();

    const onError = fakeServer.on.mock.calls.find(([event]) => event === 'error')[1];
    onError(new Error('EADDRINUSE'));

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('closes the server and the database on SIGTERM', async () => {
    db.connect.mockResolvedValue({});
    db.closeConnection.mockResolvedValue();
    await app.startServer();

    sigtermHandler()();
    await flushPromises();

    expect(fakeServer.close).toHaveBeenCalled();
    expect(db.closeConnection).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits non-zero when closing the database on SIGTERM fails', async () => {
    db.connect.mockResolvedValue({});
    db.closeConnection.mockRejectedValue(new Error('close failed'));
    await app.startServer();

    sigtermHandler()();
    await flushPromises();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
