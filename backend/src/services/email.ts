import { ServerClient } from 'postmark';

import { logger } from '../logger.js';

const token = process.env.POSTMARK_SERVER_TOKEN;
const fromAddress = process.env.POSTMARK_FROM_EMAIL ?? 'no-reply@example.com';
const templateId = process.env.POSTMARK_TEMPLATE_ID ?? 'see-it-session';

const client = token ? new ServerClient(token) : null;

export async function sendSessionEmail(params: {
  to: string;
  sessionId: string;
  productTitle?: string;
  previewUrls: string[];
}) {
  if (!client) {
    throw new Error('Postmark not configured');
  }

  const { to, sessionId, previewUrls, productTitle } = params;

  await client.sendEmailWithTemplate({
    From: fromAddress,
    To: to,
    TemplateAlias: templateId,
    TemplateModel: {
      session_id: sessionId,
      previews: previewUrls,
      product_title: productTitle ?? 'Your product'
    }
  });

  logger.info({ sessionId, email: to }, 'Sent session email');
}

