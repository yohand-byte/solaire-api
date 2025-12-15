import { Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import type { Request } from 'express';
export interface AuthRequest extends Request { user?: { uid: string; email?: string|null }; }
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
