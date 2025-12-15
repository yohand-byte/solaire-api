import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { setupSecurity } from './middleware/securityMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health';
import mcpRoutes from './routes/mcp';
import apiPingRoutes from './routes/apiPing';
import { getOpenApiSpec } from './openapi';
export function createApp() {
  const app = express();
  setupSecurity(app);
  app.get('/openapi.json', (_req, res) => res.json(getOpenApiSpec()));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerOptions: { url: '/openapi.json' } }));
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api', rateLimiter());
  app.use('/api', apiPingRoutes);
  app.use('/mcp', mcpRoutes);
  app.use(errorHandler);
  return app;
}
