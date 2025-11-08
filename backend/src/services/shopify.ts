const apiVersion = process.env.SHOPIFY_API_VERSION ?? '2024-07';
const shopDomain = process.env.SHOPIFY_SHOP;
const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? process.env.SHOPIFY_SESSION_TOKEN;
const cacheTtlMs = Number(process.env.SHOPIFY_CONFIG_CACHE_TTL_MS ?? 120_000);

type ProductConfig = {
  prompt: string;
  productImageUrl: string | null;
  variantId: string | null;
  productTitle: string;
};

const productConfigCache = new Map<string, { expiresAt: number; value: ProductConfig }>();

type ShopifyImage = {
  id?: number | string;
  src?: string;
  transformed_src?: string;
};

type ShopifyVariant = {
  id: number | string;
  image_id?: number | string | null;
  image?: ShopifyImage | null;
};

type ShopifyProductResponse = {
  product: {
    id: number | string;
    title: string;
    image?: ShopifyImage | null;
    images?: ShopifyImage[];
    variants?: ShopifyVariant[];
  };
};

type ShopifyMetafield = {
  namespace: string;
  key: string;
  value: string;
  type?: string;
  reference?: {
    image?: ShopifyImage | null;
    mediaImage?: ShopifyImage | null;
    [key: string]: unknown;
  } | null;
};

type ShopifyMetafieldResponse = {
  metafields: ShopifyMetafield[];
};

function assertShopifyConfig() {
  if (!shopDomain) {
    throw new Error('Missing SHOPIFY_SHOP environment variable');
  }
  if (!accessToken) {
    throw new Error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN for backend app auth');
  }
}

function normalizeShopifyId(id: string | undefined) {
  if (!id) return undefined;
  const match = id.match(/\/(\d+)(\?.*)?$/);
  return match ? match[1] : id;
}

async function shopifyRequest<T>(path: string, query: Record<string, string | undefined> = {}) {
  assertShopifyConfig();
  const baseUrl = new URL(`/admin/api/${apiVersion}/`, `https://${shopDomain}`);
  const url = new URL(path.replace(/^\//, ''), baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken as string
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify request failed (${response.status}): ${body || response.statusText}`);
  }

  return (await response.json()) as T;
}

function resolveMetafieldImageUrl(field: ShopifyMetafield | undefined) {
  if (!field) return null;
  if (field.value && /^https?:\/\//.test(field.value)) {
    return field.value;
  }
  const referenceImage = field.reference?.image ?? field.reference?.mediaImage ?? null;
  return referenceImage?.transformed_src ?? referenceImage?.src ?? null;
}

function resolveVariantImage(product: ShopifyProductResponse['product'], variantId?: string) {
  if (!variantId) return null;
  const normalizedVariantId = normalizeShopifyId(variantId);
  if (!normalizedVariantId) return null;
  const variant = product.variants?.find((item) => String(item.id) === normalizedVariantId);
  if (!variant) return null;

  if (variant.image?.src || variant.image?.transformed_src) {
    return variant.image.transformed_src ?? variant.image.src ?? null;
  }

  if (variant.image_id && product.images) {
    const image = product.images.find((img) => String(img.id) === String(variant.image_id));
    return image?.transformed_src ?? image?.src ?? null;
  }

  return null;
}

export const shopify = {
  async fetchProductConfig(productId: string, variantId?: string) {
    const normalizedProductId = normalizeShopifyId(productId);
    if (!normalizedProductId) {
      throw new Error('Invalid productId');
    }

    const cacheKey = `${normalizedProductId}:${variantId ?? 'default'}`;
    const now = Date.now();
    const cached = productConfigCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const product = await shopifyRequest<ShopifyProductResponse>(`products/${normalizedProductId}.json`, {
      fields: 'id,title,image,images,variants'
    });

    const metafields = await shopifyRequest<ShopifyMetafieldResponse>(
      `products/${normalizedProductId}/metafields.json`,
      {
        namespace: 'custom'
      }
    );

    const promptField = metafields.metafields.find(
      (field) => field.namespace === 'custom' && field.key === 'see_it_prompt'
    );
    const prompt = promptField?.value?.trim();

    if (!prompt) {
      throw new Error(`Missing see_it_prompt metafield for product ${productId}`);
    }

    const imageField = metafields.metafields.find(
      (field) => field.namespace === 'custom' && field.key === 'see_it_image'
    );

    const productImageUrl =
      resolveVariantImage(product.product, variantId) ??
      resolveMetafieldImageUrl(imageField) ??
      product.product.image?.transformed_src ??
      product.product.image?.src ??
      null;

    const value: ProductConfig = {
      prompt,
      productImageUrl,
      variantId: variantId ?? null,
      productTitle: product.product.title
    };

    productConfigCache.set(cacheKey, { value, expiresAt: now + cacheTtlMs });

    return value;
  }
};

