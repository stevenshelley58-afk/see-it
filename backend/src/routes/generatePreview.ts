import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { firestore } from '../services/firestore.js';
import { generatePreviewImage } from '../services/vertex.js';
import { shopify } from '../services/shopify.js';
import { logger } from '../logger.js';

const requestSchema = z.object({
  roomImageGcsUrl: z.string().url(),
  productId: z.string(),
  placement: z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
    rotation: z.number()
  }),
  sessionId: z.string().uuid().or(z.string().min(8)),
  variantId: z.string().optional(),
  locale: z.string().optional()
});

export function registerGeneratePreviewRoute(app: Express) {
  app.post('/generate-preview', async (req: Request, res: Response) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { roomImageGcsUrl, productId, placement, sessionId, variantId, locale } = parsed.data;

    const shopOrigin = req.shopifySession?.shopOrigin ?? null;
    try {
      const productConfig = await shopify.fetchProductConfig(productId, variantId);
      await firestore.ensureSession(sessionId, {
        productId,
        variantId,
        productTitle: productConfig.productTitle,
        shopOrigin,
        locale: locale ?? null
      });

      const generatedUrl = await generatePreviewImage({
        roomImageUrl: roomImageGcsUrl,
        productPrompt: productConfig.prompt,
        placement
      });

      await firestore.appendGeneratedImage(sessionId, generatedUrl);
      await firestore.recordActivity({
        type: 'preview_generated',
        sessionId,
        productId,
        productTitle: productConfig.productTitle,
        shopOrigin,
        previewUrl: generatedUrl,
        status: 'complete'
      });

      res.status(202).json({
        status: 'complete',
        previewUrl: generatedUrl,
        promptUsed: productConfig.prompt
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to generate preview');
      await firestore.recordActivity({
        type: 'preview_failed',
        sessionId,
        productId,
        shopOrigin,
        status: 'error',
        metadata: {
          reason: (error as Error)?.message ?? 'unknown'
        }
      });
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });
}

