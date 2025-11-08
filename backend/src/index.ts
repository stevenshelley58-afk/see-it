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
import { registerAdminProductsRoute } from './routes/adminProducts.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

function parseList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeOrigin(value: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

const configuredOrigins = parseList(process.env.ALLOWED_ORIGINS).map(normalizeOrigin);
const shopDomainOrigins = Array.from(
  new Set(parseList(process.env.SHOPIFY_SHOP).concat(parseList(process.env.SHOPIFY_ALLOWED_SHOPS)))
)
  .map(normalizeOrigin)
  .filter((origin): origin is string => Boolean(origin));

const allowedOrigins = Array.from(
  new Set(
    configuredOrigins
      .concat(shopDomainOrigins)
      .filter((origin): origin is string => typeof origin === 'string')
  )
);

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
  registerAdminProductsRoute(app);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  app.listen(PORT, () => {
    logger.info(`See It backend listening on ${PORT}`);
  });
}

