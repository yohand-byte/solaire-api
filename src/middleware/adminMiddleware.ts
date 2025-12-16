import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { getDb } from '../config/firebase';

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const snap = await getDb().collection('users').doc(req.user.uid).get();
    const role = snap.exists ? (snap.data() as any).role : null;
    if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed' });
  }
};
