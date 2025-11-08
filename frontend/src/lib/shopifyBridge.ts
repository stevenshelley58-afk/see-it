'use client';

import type { AppConfig } from '@shopify/app-bridge';
import type { AppBridgeState } from '@shopify/app-bridge/client/types';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';

const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
const HOST_STORAGE_KEY = 'seeit-shopify-host';

type ShopifyRuntimeContext = {
  productId?: string;
  variantId?: string | null;
  locale?: string | null;
  shopOrigin?: string | null;
};

type ShopifyApp = ReturnType<typeof createApp>;

let appPromise: Promise<ShopifyApp | null> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readHostFromSearch() {
  if (!isBrowser()) return null;
  const params = new URLSearchParams(window.location.search);
  const host = params.get('host');
  if (host) {
    try {
      window.sessionStorage.setItem(HOST_STORAGE_KEY, host);
    } catch {
      // Ignore storage issues
    }
    return host;
  }
  try {
    return window.sessionStorage.getItem(HOST_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function ensureAppBridge(): Promise<ShopifyApp | null> {
  if (!isBrowser()) return null;
  if (!apiKey) return null;
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const host = readHostFromSearch();
    if (!host) {
      return null;
    }

    const config: AppConfig = {
      apiKey,
      host,
      forceRedirect: false
    };

    return createApp(config);
  })();

  return appPromise;
}

function pickString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function readNestedString(source: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = source;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' && current.length > 0 ? current : undefined;
}

function extractShopifyContext(state: AppBridgeState | undefined): ShopifyRuntimeContext {
  if (!state) return {};
  const record = state as unknown as Record<string, unknown>;
  const productId = pickString(
    readNestedString(record, ['resource', 'id']),
    readNestedString(record, ['resourceId']),
    readNestedString(record, ['context', 'resourceId']),
    readNestedString(record, ['context', 'id']),
    readNestedString(record, ['product', 'id'])
  );
  const variantId = pickString(
    readNestedString(record, ['context', 'variantId']),
    readNestedString(record, ['selectedVariant', 'id'])
  );
  const locale = pickString(
    readNestedString(record, ['locale']),
    readNestedString(record, ['context', 'webshopLocale']),
    readNestedString(record, ['context', 'locale'])
  );
  const shopOrigin = pickString(
    readNestedString(record, ['shopOrigin']),
    readNestedString(record, ['context', 'shopOrigin']),
    readNestedString(record, ['context', 'shopDomain'])
  );

  return {
    productId,
    variantId: variantId ?? null,
    locale: locale ?? null,
    shopOrigin: shopOrigin ?? null
  };
}

function extractContextFromQuery(): ShopifyRuntimeContext {
  if (!isBrowser()) return {};
  const params = new URLSearchParams(window.location.search);
  return {
    productId: params.get('productId') ?? undefined,
    variantId: params.get('variantId'),
    locale: params.get('locale'),
    shopOrigin: params.get('shop')
  };
}

export async function fetchShopifyContext(): Promise<ShopifyRuntimeContext> {
  try {
    const app = await ensureAppBridge();
    if (!app) {
      return extractContextFromQuery();
    }
    const state = await app.getState();
    const context = extractShopifyContext(state);
    if (!context.productId) {
      const fallback = extractContextFromQuery();
      return { ...fallback, ...context };
    }
    return context;
  } catch {
    return extractContextFromQuery();
  }
}

export async function fetchSessionToken(): Promise<string | null> {
  try {
    const app = await ensureAppBridge();
    if (!app) return null;
    return await getSessionToken(app);
  } catch {
    return null;
  }
}


