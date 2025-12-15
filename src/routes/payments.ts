import { Router } from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/paymentService';

const router = Router();
const svc = new PaymentService();

const intentSchema = z.object({ amount: z.number().int().positive(), currency: z.string().default('eur') });
const confirmSchema = z.object({ intentId: z.string().min(1) });

router.post('/intent', async (req, res, next) => {
  try {
    const body = intentSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid payload' });
    if (!svc.isEnabled()) return res.status(501).json({ error: 'Stripe not configured', code: 'NOT_CONFIGURED' });
    const result = await svc.createIntent(body.data.amount, body.data.currency);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/confirm', async (req, res, next) => {
  try {
    const body = confirmSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid payload' });
    if (!svc.isEnabled()) return res.status(501).json({ error: 'Stripe not configured', code: 'NOT_CONFIGURED' });
    const result = await svc.confirmIntent(body.data.intentId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/webhooks/stripe', async (req, res, next) => {
  try {
    const result = await svc.handleWebhook(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
