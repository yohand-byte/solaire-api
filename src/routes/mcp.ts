import { Router } from 'express';
const router = Router();

router.get('/workflows/list', async (_req, res, next) => {
  try {
    const items = await new (require('../services/workflowService').WorkflowService)().list();
    res.json({ items, status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.post('/workflows/list', async (_req, res, next) => {
  try {
    const items = await new (require('../services/workflowService').WorkflowService)().list();
    res.json({ items, status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.get('/documents/list', async (_req, res, next) => {
  try {
    const items = await new (require('../services/documentService').DocumentService)().list();
    res.json({ items, status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.post('/documents/list', async (_req, res, next) => {
  try {
    const items = await new (require('../services/documentService').DocumentService)().list();
    res.json({ items, status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
