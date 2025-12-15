import { Router } from 'express';
const router = Router();

router.get('/workflows', async (_req, res, next) => {
  try {
    const { WorkflowService } = require('../services/workflowService');
    const items = await new WorkflowService().list();
    res.json({ items });
  } catch (err) {
    console.error('workflows list error', err);
    next(err);
  }
});

router.get('/documents', async (_req, res, next) => {
  try {
    const { DocumentService } = require('../services/documentService');
    const items = await new DocumentService().list();
    res.json({ items });
  } catch (err) {
    console.error('documents list error', err);
    next(err);
  }
});

export default router;
