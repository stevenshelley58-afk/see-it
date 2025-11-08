const apiVersion = process.env.SHOPIFY_API_VERSION ?? '2024-07';

function selectPrimaryShopDomain() {
  const candidates = (process.env.SHOPIFY_SHOP ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (!candidates.length && process.env.SHOPIFY_ALLOWED_SHOPS) {
    candidates.push(
      ...process.env.SHOPIFY_ALLOWED_SHOPS.split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    );
  }
  return candidates[0] ?? null;
}

const shopDomain = selectPrimaryShopDomain();
const accessToken =
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? process.env.SHOPIFY_SESSION_TOKEN;
const cacheTtlMs = Number(process.env.SHOPIFY_CONFIG_CACHE_TTL_MS ?? 120_000);

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
  extensions?: {
    cost?: {
      requestedQueryCost?: number;
      actualQueryCost?: number;
      throttleStatus?: {
        currentlyAvailable?: number;
        maximumAvailable?: number;
        restoreRate?: number;
      };
    };
  };
};

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

type AdminProductNode = {
  id: string;
  title: string;
  status: string;
  featuredImage?: { url?: string | null } | null;
  totalVariants: number;
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      image?: { url?: string | null } | null;
    }>;
  };
  metafieldPrompt?: {
    id: string;
    value: string | null;
  } | null;
  metafieldImage?: {
    id: string;
    reference?: {
      __typename?: string;
      image?: { url?: string | null } | null;
      src?: string | null;
    } | null;
    value?: string | null;
  } | null;
};

type AdminProductQuery = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
    nodes: AdminProductNode[];
  };
};

type MetafieldsSetResult = {
  metafieldsSet: {
    metafields: Array<{
      id: string;
      namespace: string;
      key: string;
      value: string;
      type: string;
    }>;
    userErrors: Array<{
      field?: string[] | null;
      message: string;
    }>;
  };
};

type MetafieldDeleteResult = {
  metafieldDelete: {
    deletedId?: string | null;
    userErrors: Array<{
      field?: string[] | null;
      message: string;
    }>;
  };
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

function toProductGid(id: string) {
  if (id.startsWith('gid://')) {
    return id;
  }
  const normalized = normalizeShopifyId(id);
  if (!normalized) {
    throw new Error('Invalid product identifier');
  }
  return `gid://shopify/Product/${normalized}`;
}

function parseProductId(gid: string) {
  const match = gid.match(/Product\/(\d+)(\?.*)?$/);
  return match ? match[1] : gid;
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

async function shopifyGraphqlRequest<T>(query: string, variables: Record<string, unknown> = {}) {
  assertShopifyConfig();
  const url = new URL(`/admin/api/${apiVersion}/graphql.json`, `https://${shopDomain}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken as string
    },
    body: JSON.stringify({ query, variables })
  });

  const json = (await response.json()) as GraphQlResponse<T>;

  if (!response.ok) {
    const message = json.errors?.map((err) => err.message).join('; ') ?? response.statusText;
    throw new Error(`Shopify GraphQL request failed (${response.status}): ${message}`);
  }

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL returned errors: ${json.errors.map((err) => err.message).join('; ')}`);
  }

  if (!json.data) {
    throw new Error('Shopify GraphQL response missing data');
  }

  return json.data;
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
  },

  async listAdminProducts(params: { after?: string | null; limit?: number } = {}) {
    const query = /* GraphQL */ `
      query ProductConfigs($after: String, $first: Int) {
        products(first: $first, after: $after, sortKey: TITLE) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
            status
            totalVariants
            featuredImage {
              url
            }
            variants(first: 50) {
              nodes {
                id
                title
                image {
                  url
                }
              }
            }
            metafieldPrompt: metafield(namespace: "custom", key: "see_it_prompt") {
              id
              value
            }
            metafieldImage: metafield(namespace: "custom", key: "see_it_image") {
              id
              value
              reference {
                __typename
                ... on MediaImage {
                  image {
                    url
                  }
                }
                ... on GenericFile {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyGraphqlRequest<AdminProductQuery>(query, {
      after: params.after ?? null,
      first: Math.max(1, Math.min(params.limit ?? 20, 50))
    });

    const products = data.products.nodes.map((node) => {
      const productId = parseProductId(node.id);
      const promptValue = node.metafieldPrompt?.value?.trim() ?? null;
      const imageValue =
        node.metafieldImage?.reference?.image?.url ?? node.metafieldImage?.value ?? null;
      return {
        id: productId,
        gid: node.id,
        title: node.title,
        status: node.status,
        totalVariants: node.totalVariants,
        prompt: promptValue,
        promptMetafieldId: node.metafieldPrompt?.id ?? null,
        imageUrl: imageValue,
        imageMetafieldId: node.metafieldImage?.id ?? null,
        featuredImageUrl: node.featuredImage?.url ?? null,
        variants: node.variants.nodes.map((variant) => ({
          id: parseProductId(variant.id),
          gid: variant.id,
          title: variant.title,
          imageUrl: variant.image?.url ?? null
        }))
      };
    });

    return {
      products,
      pageInfo: data.products.pageInfo
    };
  },

  async updateProductMetafields(params: {
    productId: string;
    prompt: string;
    promptMetafieldId?: string | null;
    imageUrl?: string | null;
    imageMetafieldId?: string | null;
  }) {
    const trimmedPrompt = params.prompt.trim();
    if (!trimmedPrompt) {
      throw new Error('Prompt cannot be empty');
    }

    const ownerId = toProductGid(params.productId);
    const metafieldsInputs: Array<Record<string, string>> = [
      {
        ownerId,
        namespace: 'custom',
        key: 'see_it_prompt',
        type: 'single_line_text_field',
        value: trimmedPrompt
      }
    ];

    if (params.imageUrl !== undefined && params.imageUrl !== null) {
      metafieldsInputs.push({
        ownerId,
        namespace: 'custom',
        key: 'see_it_image',
        type: 'url',
        value: params.imageUrl
      });
    }

    let nextPromptMetafieldId = params.promptMetafieldId ?? null;
    let nextImageMetafieldId = params.imageMetafieldId ?? null;

    if (metafieldsInputs.length > 0) {
      const mutation = /* GraphQL */ `
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const result = await shopifyGraphqlRequest<MetafieldsSetResult>(mutation, {
        metafields: metafieldsInputs
      });

      if (result.metafieldsSet.userErrors.length) {
        const message = result.metafieldsSet.userErrors
          .map((error) => error.message)
          .join('; ');
        throw new Error(`Failed to update metafields: ${message}`);
      }

      for (const metafield of result.metafieldsSet.metafields) {
        if (metafield.namespace === 'custom' && metafield.key === 'see_it_prompt') {
          nextPromptMetafieldId = metafield.id;
        }
        if (metafield.namespace === 'custom' && metafield.key === 'see_it_image') {
          nextImageMetafieldId = metafield.id;
        }
      }
    }

    if (params.imageUrl === null && params.imageMetafieldId) {
      const deletion = /* GraphQL */ `
        mutation MetafieldDelete($id: ID!) {
          metafieldDelete(id: $id) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const result = await shopifyGraphqlRequest<MetafieldDeleteResult>(deletion, {
        id: params.imageMetafieldId
      });

      if (result.metafieldDelete.userErrors.length) {
        const message = result.metafieldDelete.userErrors
          .map((error) => error.message)
          .join('; ');
        throw new Error(`Failed to remove image metafield: ${message}`);
      }
      nextImageMetafieldId = null;
    }

    return {
      promptMetafieldId: nextPromptMetafieldId,
      imageMetafieldId: nextImageMetafieldId
    };
  }
};

