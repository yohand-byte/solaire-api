import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { setupSecurity } from './middleware/securityMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health';
import mcpRoutes from './routes/mcp';
import apiPingRoutes from './routes/apiPing';
import apiResourcesRoutes from './routes/apiResources';
import paymentRoutes from './routes/payments';
import messageRoutes from './routes/messages';
import leadRoutes from './routes/leads';
import { getOpenApiSpec } from './openapi';
import { initializeFirebase } from './config/firebase';
export function createApp() {
  if (process.env.NODE_ENV !== 'test') {
    initializeFirebase();
  }
  const app = express();
  setupSecurity(app);
  app.get('/openapi.json', (_req, res) => res.json(getOpenApiSpec()));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerOptions: { url: '/openapi.json' } }));
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api', rateLimiter());
  app.use('/api', apiPingRoutes);
  app.use('/api', apiResourcesRoutes);
  app.use('/api', leadRoutes);
  app.use('/api', messageRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/mcp', mcpRoutes);
  app.use(errorHandler);
  return app;
}
