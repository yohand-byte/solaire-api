import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';

function parseOrigins() {
  const env = process.env.CORS_ORIGINS || '';
  const list = env.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  return list;
}

export const setupSecurity = (app: Application) => {
  app.disable('x-powered-by');
  app.use(helmet());
  const origins = parseOrigins();
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
};
