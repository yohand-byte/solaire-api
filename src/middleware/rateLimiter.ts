import { Request, Response, NextFunction } from 'express';

interface Entry {
  count: number;
  resetTime: number;
}

const store = new Map<string, Entry>();

function getKey(req: Request) {
  const userId = (req as any).user?.uid;
  if (userId) return `user:${userId}`;
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

export function rateLimiter(options?: { max?: number; windowMs?: number; enabled?: boolean }) {
  const max = options?.max ?? Number(process.env.RATE_LIMIT_MAX || 1000);
  const windowMs = options?.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const enabled = options?.enabled ?? (process.env.RATE_LIMIT_ENABLED !== 'false');

  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) return next();

    const key = getKey(req);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(max - 1));
      res.setHeader('X-RateLimit-Reset', String(Math.floor((now + windowMs) / 1000)));
      return next();
    }

    entry.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.resetTime / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMITED', retryAfter });
    }

    next();
  };
}
