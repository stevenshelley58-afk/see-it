import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { createSignedUpload } from '../services/storage.js';

const bodySchema = z.object({
  objectName: z.string().min(1),
  contentType: z.string().default('image/jpeg')
});

const bucketName = process.env.GCS_BUCKET_NAME;

export function registerUploadRoute(app: Express) {
  app.post('/uploads/sign', async (req: Request, res: Response) => {
    if (!bucketName) {
      return res.status(500).json({ error: 'GCS bucket not configured' });
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { objectName } = parsed.data;
    if (objectName.includes('..')) {
      return res.status(400).json({ error: 'Invalid object name' });
    }
    const policy = await createSignedUpload({
      bucket: bucketName,
      objectName,
      expiresInSeconds: 600
    });

    res.json({
      url: policy.url,
      fields: policy.fields,
      gcsUrl: `gs://${bucketName}/${objectName}`
    });
  });
}

