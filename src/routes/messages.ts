import { Router } from 'express';
import { z } from 'zod';
import { MessageService } from '../services/messageService';
import { getIo } from '../websocket/io';

const router = Router();
const svc = new MessageService();

const createSchema = z.object({ projectId: z.string().min(1), content: z.string().min(1), recipientId: z.string().optional() });

router.get('/messages', async (req, res, next) => {
  try {
    const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
    const items = await svc.list(projectId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post('/messages', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });
    const msg = await svc.create({ ...parsed.data, senderId: (req as any).user?.uid });
    const io = getIo();
    if (io) io.emit('message:new', msg);
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

router.put('/messages/:id/read', async (req, res, next) => {
  try {
    const updated = await svc.markRead(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    const io = getIo();
    if (io) io.emit('message:read', { id: req.params.id });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
