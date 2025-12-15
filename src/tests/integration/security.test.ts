import request from 'supertest';
import { createApp } from '../../app';

describe('Security', () => {
  const app = createApp();

  it('denies disallowed origin', async () => {
    process.env.CORS_ORIGINS = 'http://allowed.test';
    const res = await request(app).get('/health').set('Origin', 'http://bad.test');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(200); // health remains accessible
  });

  it('limits JSON body to 1mb', async () => {
    const big = 'x'.repeat(1_100_000);
    const res = await request(app).post('/api/ping').send({ big });
    expect(res.status).toBe(413);
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
  });
});
