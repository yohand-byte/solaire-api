import { Router } from 'express';
const router = Router();

router.get('/workflows', async (_req, res, next) => {
  try {
    const items = await new (require('../services/workflowService').WorkflowService)().list();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/documents', async (_req, res, next) => {
  try {
    const items = await new (require('../services/documentService').DocumentService)().list();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

export default router;
