import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { shopify } from '../services/shopify.js';
import { logger } from '../logger.js';

const listQuerySchema = z.object({
  after: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
    .pipe(z.number().int().min(1).max(50).optional())
});

const updateBodySchema = z.object({
  prompt: z.string().min(1).max(500),
  imageUrl: z
    .union([z.string().url(), z.string().length(0)])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === '') return null;
      return value;
    }),
  promptMetafieldId: z.string().optional(),
  imageMetafieldId: z.string().optional()
});

export function registerAdminProductsRoute(app: Express) {
  app.get('/admin/products', async (req: Request, res: Response) => {
    const parsed = listQuerySchema.safeParse({
      after: typeof req.query.after === 'string' ? req.query.after : undefined,
      limit: typeof req.query.limit === 'string' ? req.query.limit : undefined
    });

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    }

    try {
      const { products, pageInfo } = await shopify.listAdminProducts(parsed.data);
      res.json({ products, pageInfo });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list Shopify products for admin view');
      res.status(502).json({ error: 'Unable to load products from Shopify' });
    }
  });

  app.put('/admin/products/:productId/metafields', async (req: Request, res: Response) => {
    const productId = typeof req.params.productId === 'string' ? req.params.productId : undefined;
    if (!productId) {
      return res.status(400).json({ error: 'Invalid product identifier' });
    }

    const parsedBody = updateBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsedBody.error.flatten() });
    }

    try {
      const result = await shopify.updateProductMetafields({
        productId,
        prompt: parsedBody.data.prompt,
        promptMetafieldId: parsedBody.data.promptMetafieldId,
        imageUrl: parsedBody.data.imageUrl,
        imageMetafieldId: parsedBody.data.imageMetafieldId
      });
      res.json({
        promptMetafieldId: result.promptMetafieldId,
        imageMetafieldId: result.imageMetafieldId
      });
    } catch (error) {
      logger.error({ err: error, productId }, 'Failed to update product metafields');
      res.status(502).json({ error: (error as Error)?.message ?? 'Unable to update metafields' });
    }
  });
}


