import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
export const setupSecurity = (app: Application) => {
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
};
