import request from 'supertest';
import { createApp } from '../../app';

describe('Rate limiter', () => {
  it('returns 429 after exceeding max', async () => {
    process.env.RATE_LIMIT_MAX = '3';
    process.env.RATE_LIMIT_WINDOW_MS = '1000';
    const app = createApp();
    const max = 3;
    for (let i = 0; i < max; i++) {
      const res = await request(app).get('/api/ping');
      expect(res.status).toBe(200);
    }
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('code', 'RATE_LIMITED');
  });
});
