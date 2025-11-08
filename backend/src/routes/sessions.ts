import type { Express, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { firestore } from '../services/firestore.js';

const bodySchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  locale: z.string().optional()
});

export function registerSessionRoute(app: Express) {
  app.post('/sessions', async (req: Request, res: Response) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const sessionId = randomUUID();
    await firestore.ensureSession(sessionId, {
      ...parsed.data,
      shopOrigin: req.shopifySession?.shopOrigin ?? null
    });

    res.status(201).json({ sessionId });
  });
}

