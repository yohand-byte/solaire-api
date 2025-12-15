import request from 'supertest';
import { createApp } from '../../app';

describe('Resources', () => {
  const app = createApp();

  it('lists workflows', async () => {
    const res = await request(app).get('/api/workflows');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('lists workflows via MCP POST', async () => {
    const res = await request(app).post('/mcp/workflows/list');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('lists documents', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('lists documents via MCP POST', async () => {
    const res = await request(app).post('/mcp/documents/list');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('handles invalid path gracefully', async () => {
    const res = await request(app).get('/api/workflows?id=');
    expect(res.status).toBe(200);
  });
});
