import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { firestore } from '../services/firestore.js';

const activityQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
    .pipe(z.number().int().min(1).max(50).optional())
});

function serializeActivityItem(raw: Record<string, unknown>) {
  const createdAt = raw.createdAt;
  let isoCreatedAt: string | null = null;
  if (createdAt instanceof Date) {
    isoCreatedAt = createdAt.toISOString();
  } else if (createdAt && typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
    isoCreatedAt = (createdAt as { toDate: () => Date }).toDate().toISOString();
  }

  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    type: raw.type,
    sessionId: raw.sessionId ?? null,
    productId: raw.productId ?? null,
    productTitle: raw.productTitle ?? null,
    shopOrigin: raw.shopOrigin ?? null,
    previewUrl: raw.previewUrl ?? null,
    status: raw.status ?? null,
    metadata: raw.metadata ?? null,
    createdAt: isoCreatedAt
  };
}

export function registerAdminActivityRoute(app: Express) {
  app.get('/admin/activity', async (req: Request, res: Response) => {
    if (!req.shopifySession?.shopOrigin) {
      return res.status(401).json({ error: 'Shopify session missing shop origin' });
    }

    const parsed = activityQuerySchema.safeParse({
      limit: typeof req.query.limit === 'string' ? req.query.limit : undefined
    });

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    }

    const items = await firestore.listRecentActivity({
      shopOrigin: req.shopifySession.shopOrigin,
      limit: parsed.data.limit
    });

    res.json({
      activity: items.map((item) => serializeActivityItem(item))
    });
  });
}


