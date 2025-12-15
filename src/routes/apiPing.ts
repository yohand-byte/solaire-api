import { Router } from 'express';
const router = Router();
router.get('/ping', (_req, res) => {
  res.json({ ok: true, pong: true, at: new Date().toISOString() });
});
export default router;
