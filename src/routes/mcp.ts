import { Router } from 'express';
const router = Router();
router.get('/workflows/list', (_req, res) => {
  res.json({ items: [], status: 'ok' });
});
router.get('/documents/list', (_req, res) => {
  res.json({ items: [], status: 'ok' });
});
export default router;
