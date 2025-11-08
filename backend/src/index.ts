import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { logger } from './logger.js';
import { registerGeneratePreviewRoute } from './routes/generatePreview.js';
import { registerSessionRoute } from './routes/sessions.js';
import { registerUploadRoute } from './routes/uploads.js';
import { registerSendEmailRoute } from './routes/sendEmail.js';
import { shopifySessionMiddleware } from './middleware/shopifyAuth.js';
import { registerProductConfigRoute } from './routes/productConfig.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const shopDomain = process.env.SHOPIFY_SHOP;
const configuredOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
const impliedShopOrigin =
  shopDomain && !shopDomain.startsWith('https://') ? `https://${shopDomain}` : shopDomain;
const allowedOrigins = Array.from(
  new Set(configuredOrigins.concat(impliedShopOrigin ? [impliedShopOrigin] : []))
).filter(Boolean);

export function createApp() {
  const app = express();
  const corsOptions: CorsOptions | undefined = allowedOrigins.length
    ? {
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin ?? allowedOrigins[0] ?? true);
          } else {
            callback(null, false);
          }
        },
        credentials: true
      }
    : undefined;

  app.use(cors(corsOptions));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: '10mb' }));

  app.use(shopifySessionMiddleware);

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  registerSessionRoute(app);
  registerGeneratePreviewRoute(app);
  registerUploadRoute(app);
  registerSendEmailRoute(app);
  registerProductConfigRoute(app);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  app.listen(PORT, () => {
    logger.info(`See It backend listening on ${PORT}`);
  });
}

