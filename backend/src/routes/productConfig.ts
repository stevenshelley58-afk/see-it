import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { shopify } from '../services/shopify.js';
import { logger } from '../logger.js';

const querySchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional()
});

export function registerProductConfigRoute(app: Express) {
  app.get('/products/config', async (req: Request, res: Response) => {
    const parsed = querySchema.safeParse({
      productId: typeof req.query.productId === 'string' ? req.query.productId : undefined,
      variantId: typeof req.query.variantId === 'string' ? req.query.variantId : undefined
    });

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    try {
      const config = await shopify.fetchProductConfig(parsed.data.productId, parsed.data.variantId);
      res.json(config);
    } catch (error) {
      logger.error(
        { err: error, productId: parsed.data.productId, variantId: parsed.data.variantId },
        'Failed to load Shopify product config'
      );
      res.status(502).json({ error: 'Failed to load product configuration' });
    }
  });
}


