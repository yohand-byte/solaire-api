import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { setupSecurity } from './middleware/securityMiddleware';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import { getOpenApiSpec } from './openapi';
export function createApp() {
  const app = express();
  setupSecurity(app);
  app.get('/openapi.json', (_req, res) => res.json(getOpenApiSpec()));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerOptions: { url: '/openapi.json' } }));
  app.use('/health', healthRoutes);
  app.use(errorHandler);
  return app;
}
