import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const apiKey = process.env.SHOPIFY_API_KEY;
const jwksUrl = new URL('https://shopify.com/admin/oauth/jwks.json');

function parseList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeShopDomain(domain: string) {
  const withoutProtocol = domain.replace(/^https?:\/\//i, '');
  return withoutProtocol.replace(/\/+$/, '');
}

const allowedShopDomains = Array.from(
  new Set(
    parseList(process.env.SHOPIFY_SHOP)
      .concat(parseList(process.env.SHOPIFY_ALLOWED_SHOPS))
      .map(normalizeShopDomain)
  )
).filter((domain) => domain.length > 0);

type ShopifySession = {
  shop: string;
  shopOrigin: string;
  sessionToken: string;
  payload: JWTPayload;
};

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      shopifySession?: ShopifySession;
    }
  }
}

const publicPaths = new Set(['/healthz']);
const jwks = createRemoteJWKSet(jwksUrl);

function deriveExpectedIssuer(domain: string | undefined) {
  if (!domain) return undefined;
  const cleanDomain = domain.startsWith('https://') ? domain : `https://${domain}`;
  return `${cleanDomain.replace(/\/+$/, '')}/admin`;
}

export async function shopifySessionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS' || publicPaths.has(req.path)) {
    return next();
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Shopify API key not configured' });
  }

  const authHeader = req.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Shopify session token' });
  }

  try {
    const expectedIssuers = allowedShopDomains
      .map((domain) => deriveExpectedIssuer(domain))
      .filter((issuer): issuer is string => Boolean(issuer));

    const { payload } = await jwtVerify(token, jwks, {
      issuer: expectedIssuers.length ? expectedIssuers : undefined,
      audience: apiKey
    });

    const dest = typeof payload.dest === 'string' ? payload.dest : undefined;
    const shop = typeof payload.sub === 'string' ? payload.sub : undefined;
    const shopUrl = (dest ?? (shop ? `https://${shop}` : undefined)) ?? null;
    const originUrl = shopUrl ? new URL(shopUrl) : null;
    const normalizedOrigin = originUrl ? `${originUrl.protocol}//${originUrl.host}` : null;
    const shopHost = originUrl?.host ?? (shop ? normalizeShopDomain(shop) : null);

    if (!normalizedOrigin || !shopHost) {
      throw new Error('Unable to resolve shop origin from session token');
    }

    if (allowedShopDomains.length > 0 && !allowedShopDomains.includes(shopHost)) {
      throw new Error('Session token shop mismatch');
    }

    req.shopifySession = {
      shop: shopHost,
      shopOrigin: normalizedOrigin,
      sessionToken: token,
      payload
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Shopify session token' });
  }
}


