import request from 'supertest';
import { createServer } from 'http';
import ioClient from 'socket.io-client';
import { createApp } from '../../app';
import { setupWebsocket } from '../../websocket/server';

describe('Messages', () => {
  const app = createApp();
  let httpServer: any;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer(app);
    setupWebsocket(httpServer);
    httpServer.listen(0, () => {
      port = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  it('lists messages empty', async () => {
    const res = await request(app).get('/api/messages?projectId=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('creates and marks read', async () => {
    const createRes = await request(app).post('/api/messages').send({ projectId: 'p1', content: 'hello' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;
    const readRes = await request(app).put(`/api/messages/${id}/read`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.read).toBe(true);
  });

  it('emits message:new over socket', (done) => {
    const client = ioClient(`http://localhost:${port}`);
    client.on('connect', async () => {
      await request(app).post('/api/messages').send({ projectId: 'p2', content: 'ws' });
    });
    client.on('message:new', (msg: any) => {
      try {
        expect(msg.content).toBe('ws');
        client.disconnect();
        done();
      } catch (err) {
        done(err);
      }
    });
    client.on('connect_error', (err: any) => done(err));
  });
});
