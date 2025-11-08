import type { Express, Request, Response } from 'express';
import { z } from 'zod';

import { firestore } from '../services/firestore.js';
import { sendSessionEmail } from '../services/email.js';
import { logger } from '../logger.js';

const bodySchema = z.object({
  sessionId: z.string(),
  email: z.string().email()
});

export function registerSendEmailRoute(app: Express) {
  app.post('/send-session-email', async (req: Request, res: Response) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { sessionId, email } = parsed.data;
    const session = await firestore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const previews: string[] = session.generatedImageURLs ?? [];

    if (previews.length === 0) {
      return res.status(400).json({ error: 'No previews available for this session' });
    }

    try {
      await sendSessionEmail({
        to: email,
        sessionId,
        productTitle: session.productTitle,
        previewUrls: previews
      });
    } catch (error) {
      logger.error({ err: error, sessionId }, 'Failed to send session email');
      return res.status(500).json({ error: 'Failed to send email' });
    }

    await firestore.saveEmail(sessionId, email);

    res.status(200).json({ status: 'sent' });
  });
}

