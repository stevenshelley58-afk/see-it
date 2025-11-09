import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { firestore } from '../services/firestore.js';
import { shopify } from '../services/shopify.js';
import { generatePreviewImage } from '../services/vertex.js';
import { logger } from '../logger.js';

type SandboxTemplate = {
  id: string;
  label: string;
  description?: string;
  thumbnailUrl?: string;
  roomImageGcsUrl: string;
  placement: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
};

const templateConfig = process.env.SANDBOX_ROOM_TEMPLATES;
let templates: SandboxTemplate[] = [];

function loadTemplates() {
  if (templates.length > 0) {
    return templates;
  }

  if (templateConfig) {
    try {
      const parsed = JSON.parse(templateConfig) as SandboxTemplate[];
      if (Array.isArray(parsed) && parsed.length) {
        templates = parsed;
        return templates;
      }
    } catch (error) {
      logger.warn({ err: error }, 'Failed to parse SANDBOX_ROOM_TEMPLATES configuration');
    }
  }

  templates = [
    {
      id: 'living-room',
      label: 'Bright living room',
      description: 'Soft natural light, neutral walls, wood floors. Ideal for sofas and chairs.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=360&q=70',
      roomImageGcsUrl: 'gs://see-it-sandbox-templates/living-room.jpg',
      placement: {
        x: 0.52,
        y: 0.62,
        scale: 0.42,
        rotation: 0
      }
    },
    {
      id: 'bedroom',
      label: 'Modern bedroom',
      description: 'Warm lighting, linen bedding, framed artwork. Great for decor pieces.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1616594039964-5f8a373c0e3f?auto=format&fit=crop&w=360&q=70',
      roomImageGcsUrl: 'gs://see-it-sandbox-templates/bedroom.jpg',
      placement: {
        x: 0.5,
        y: 0.58,
        scale: 0.36,
        rotation: 0
      }
    },
    {
      id: 'dining',
      label: 'Sunlit dining nook',
      description: 'Corner banquette with bright windows, crisp afternoon light.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1616627456211-f6bac9d11c81?auto=format&fit=crop&w=360&q=70',
      roomImageGcsUrl: 'gs://see-it-sandbox-templates/dining.jpg',
      placement: {
        x: 0.5,
        y: 0.6,
        scale: 0.38,
        rotation: 0
      }
    }
  ];

  return templates;
}

const previewRequestSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  promptOverride: z.string().min(1).max(500).optional(),
  templateId: z.string()
});

const parsedSandboxLimit = Number.parseInt(process.env.SANDBOX_DAILY_LIMIT ?? '15', 10);
const sandboxLimit = Number.isNaN(parsedSandboxLimit) ? 15 : Math.max(1, parsedSandboxLimit);

function currentDateKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function registerAdminPreviewSandboxRoute(app: Express) {
  app.get('/admin/preview-sandbox/templates', (_req: Request, res: Response) => {
    res.json({ templates: loadTemplates().map(({ roomImageGcsUrl, ...rest }) => rest) });
  });

  app.post('/admin/preview-sandbox/run', async (req: Request, res: Response) => {
    if (!req.shopifySession?.shopOrigin) {
      return res.status(401).json({ error: 'Shopify session missing shop origin' });
    }

    const parsed = previewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const template = loadTemplates().find((item) => item.id === parsed.data.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const dateKey = currentDateKey();
    const shopOrigin = req.shopifySession.shopOrigin;

    try {
      const { count } = await firestore.getSandboxUsage(shopOrigin, dateKey);
      if (count >= sandboxLimit) {
        return res.status(429).json({
          error: 'Sandbox quota exceeded',
          remaining: 0,
          resetAt: dateKey
        });
      }

      let prompt = parsed.data.promptOverride?.trim();
      if (!prompt) {
        const productConfig = await shopify.fetchProductConfig(parsed.data.productId, parsed.data.variantId);
        prompt = productConfig.prompt;
      }

      const previewUrl = await generatePreviewImage({
        roomImageUrl: template.roomImageGcsUrl,
        productPrompt: prompt,
        placement: template.placement
      });

      await firestore.incrementSandboxUsage(shopOrigin, dateKey);
      await firestore.recordActivity({
        type: 'sandbox_preview',
        sessionId: null,
        productId: parsed.data.productId,
        productTitle: null,
        shopOrigin,
        previewUrl,
        status: 'complete',
        metadata: {
          templateId: template.id,
          dateKey
        }
      });

      const { count: updatedCount } = await firestore.getSandboxUsage(shopOrigin, dateKey);

      res.status(200).json({
        previewUrl,
        templateId: template.id,
        remaining: Math.max(0, sandboxLimit - updatedCount)
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to execute sandbox preview');
      res.status(500).json({ error: 'Sandbox preview failed' });
    }
  });
}


