import { createServer } from 'http';
import ioClient from 'socket.io-client';
import { createApp } from '../../app';
import { setupWebsocket } from '../../websocket/server';

describe('WebSocket ping/pong', () => {
  let httpServer: any;
  let port: number;

  beforeAll((done) => {
    const app = createApp();
    httpServer = createServer(app);
    setupWebsocket(httpServer);
    httpServer.listen(0, () => {
      port = (httpServer.address() as any).port;
      done();
    });
  }, 10000);

  afterAll((done) => {
    if (httpServer) httpServer.close(done);
  });

  it('responds pong to ping', (done) => {
    const client = ioClient(`http://localhost:${port}`);
    client.on('connect', () => client.emit('ping'));
    client.on('pong', () => {
      client.disconnect();
      done();
    });
    client.on('connect_error', (err: any) => done(err));
  });
});
