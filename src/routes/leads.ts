import { Router } from 'express';
import { leadSchema, LeadService } from '../services/leadService';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();
const svc = new LeadService();

router.post('/leads', async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  try {
    const lead = await svc.create(parsed.data);
    res.status(201).json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads', authMiddleware, adminMiddleware, async (_req, res) => {
  const list = await svc.list();
  res.json({ items: list });
});

router.post('/leads/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await svc.approve(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Lead not found' ? 404 : 500).json({ error: err.message });
  }
});

router.post('/leads/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await svc.updateStatus(req.params.id, 'rejected');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
