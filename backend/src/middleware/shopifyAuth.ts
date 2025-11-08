import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const apiKey = process.env.SHOPIFY_API_KEY;
const shopDomain = process.env.SHOPIFY_SHOP;
const jwksUrl = new URL('https://shopify.com/admin/oauth/jwks.json');

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
    const issuer = deriveExpectedIssuer(shopDomain);
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: apiKey
    });

    const dest = typeof payload.dest === 'string' ? payload.dest : undefined;
    const shop = typeof payload.sub === 'string' ? payload.sub : undefined;
    const shopOrigin = dest ?? (shop ? `https://${shop}` : undefined);

    if (!shopOrigin) {
      throw new Error('Unable to resolve shop origin from session token');
    }

    if (shopDomain && !shopOrigin.includes(shopDomain)) {
      throw new Error('Session token shop mismatch');
    }

    req.shopifySession = {
      shop: shop ?? shopOrigin,
      shopOrigin,
      sessionToken: token,
      payload
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Shopify session token' });
  }
}


