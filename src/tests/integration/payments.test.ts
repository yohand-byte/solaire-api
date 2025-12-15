import request from 'supertest';
import { createApp } from '../../app';

describe('Payments', () => {
  const app = createApp();

  it('returns 501 when Stripe not configured (intent)', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await request(app).post('/api/payments/intent').send({ amount: 1000, currency: 'eur' });
    expect(res.status).toBe(501);
    expect(res.body).toHaveProperty('code', 'NOT_CONFIGURED');
  });

  it('returns 501 when Stripe not configured (confirm)', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await request(app).post('/api/payments/confirm').send({ intentId: 'pi_mock' });
    expect(res.status).toBe(501);
    expect(res.body).toHaveProperty('code', 'NOT_CONFIGURED');
  });
});
