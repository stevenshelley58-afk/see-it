import { z } from 'zod';

import { backendBaseUrl, mockPreviewPlaceholders, mockApiEnabled } from './config';

const sessionSchema = z.object({
  sessionId: z.string()
});

const signedUploadSchema = z.object({
  url: z.string().url(),
  fields: z.record(z.string()),
  gcsUrl: z.string()
});

const previewResponseSchema = z.object({
  status: z.string(),
  previewUrl: z.string().url(),
  promptUsed: z.string().optional()
});

const emailResponseSchema = z.object({
  status: z.string()
});

const productConfigSchema = z.object({
  prompt: z.string(),
  productImageUrl: z.string().url().nullable(),
  variantId: z.string().nullable(),
  productTitle: z.string()
});

const adminVariantSchema = z.object({
  id: z.string(),
  gid: z.string(),
  title: z.string(),
  imageUrl: z.string().url().nullable()
});

const adminProductSchema = z.object({
  id: z.string(),
  gid: z.string(),
  title: z.string(),
  status: z.string(),
  totalVariants: z.number(),
  prompt: z.string().nullable(),
  promptMetafieldId: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  imageMetafieldId: z.string().nullable(),
  featuredImageUrl: z.string().url().nullable(),
  variants: z.array(adminVariantSchema)
});

const adminProductListSchema = z.object({
  products: z.array(adminProductSchema),
  pageInfo: z.object({
    hasNextPage: z.boolean(),
    endCursor: z.string().nullable()
  })
});

const adminMetafieldUpdateSchema = z.object({
  promptMetafieldId: z.string().nullable(),
  imageMetafieldId: z.string().nullable()
});

const sandboxTemplateSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional()
});

const sandboxTemplateListSchema = z.object({
  templates: z.array(sandboxTemplateSchema)
});

const sandboxRunResponseSchema = z.object({
  previewUrl: z.string().url(),
  templateId: z.string(),
  remaining: z.number()
});

const adminActivityItemSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  sessionId: z.string().nullable(),
  productId: z.string().nullable(),
  productTitle: z.string().nullable(),
  shopOrigin: z.string().nullable(),
  previewUrl: z.string().nullable(),
  status: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().nullable()
});

const adminActivityResponseSchema = z.object({
  activity: z.array(adminActivityItemSchema)
});

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function createSession(params: {
  productId: string;
  variantId?: string;
  locale?: string;
  authToken?: string;
}) {
  if (mockApiEnabled) {
    await wait(150);
    const uuid =
      typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `mock-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    return { sessionId: uuid };
  }

  const { authToken, ...body } = params;
  const res = await fetch(`${backendBaseUrl}/sessions`, {
    method: 'POST',
    headers: buildJsonHeaders(authToken),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to create session (${res.status})`);
  }

  const json = await res.json();
  return sessionSchema.parse(json);
}

export async function requestSignedUpload(params: { objectName: string; contentType?: string; authToken?: string }) {
  if (mockApiEnabled) {
    await wait(120);
    return {
      url: 'mock://upload',
      fields: {},
      gcsUrl: `gs://mock/${params.objectName}`
    };
  }

  const { authToken, ...body } = params;
  const res = await fetch(`${backendBaseUrl}/uploads/sign`, {
    method: 'POST',
    headers: buildJsonHeaders(authToken),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch signed upload (${res.status})`);
  }

  const json = await res.json();
  return signedUploadSchema.parse(json);
}

export async function requestGeneratedPreview(params: {
  sessionId: string;
  roomImageGcsUrl: string;
  productId: string;
  placement: { x: number; y: number; scale: number; rotation: number };
  locale?: string;
  authToken?: string;
}) {
  if (mockApiEnabled) {
    await wait(600);
    return {
      status: 'complete',
      previewUrl: randomItem(mockPreviewPlaceholders),
      promptUsed: undefined
    };
  }

  const { authToken, ...body } = params;
  const res = await fetch(`${backendBaseUrl}/generate-preview`, {
    method: 'POST',
    headers: buildJsonHeaders(authToken),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to generate preview (${res.status})`);
  }

  const json = await res.json();
  return previewResponseSchema.parse(json);
}

export async function sendSessionEmail(params: { sessionId: string; email: string; authToken?: string }) {
  if (mockApiEnabled) {
    await wait(300);
    return emailResponseSchema.parse({ status: 'sent' });
  }

  const { authToken, ...body } = params;
  const res = await fetch(`${backendBaseUrl}/send-session-email`, {
    method: 'POST',
    headers: buildJsonHeaders(authToken),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to send session email (${res.status})`);
  }

  const json = await res.json();
  return emailResponseSchema.parse(json);
}

export async function fetchProductConfig(params: { productId: string; variantId?: string; authToken?: string }) {
  if (mockApiEnabled) {
    await wait(150);
    return productConfigSchema.parse({
      prompt: 'A hero shot of the product styled in a modern coastal living room',
      productImageUrl:
        'https://images.unsplash.com/photo-1616628182501-0bbcfd084d94?auto=format&fit=crop&w=800&q=70',
      variantId: params.variantId ?? null,
      productTitle: 'Modern Velvet Armchair'
    });
  }

  const url = new URL(`${backendBaseUrl}/products/config`);
  url.searchParams.set('productId', params.productId);
  if (params.variantId) {
    url.searchParams.set('variantId', params.variantId);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: params.authToken ? { Authorization: `Bearer ${params.authToken}` } : undefined
  });

  if (!res.ok) {
    throw new Error(`Failed to load product config (${res.status})`);
  }

  return productConfigSchema.parse(await res.json());
}

export async function fetchAdminProducts(params: { after?: string; limit?: number; authToken?: string } = {}) {
  if (mockApiEnabled) {
    await wait(150);
    return adminProductListSchema.parse({
      products: [
        {
          id: '1234567890',
          gid: 'gid://shopify/Product/1234567890',
          title: 'Mock Sofa',
          status: 'ACTIVE',
          totalVariants: 2,
          prompt: 'A modern living room scene featuring the sofa with cozy lighting and neutral walls',
          promptMetafieldId: null,
          imageUrl: mockPreviewPlaceholders[0],
          imageMetafieldId: null,
          featuredImageUrl: mockPreviewPlaceholders[1],
          variants: [
            {
              id: '1234567890',
              gid: 'gid://shopify/ProductVariant/1234567890',
              title: 'Default Title',
              imageUrl: mockPreviewPlaceholders[2]
            }
          ]
        }
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null
      }
    });
  }

  const url = new URL(`${backendBaseUrl}/admin/products`);
  if (params.after) {
    url.searchParams.set('after', params.after);
  }
  if (params.limit) {
    url.searchParams.set('limit', String(params.limit));
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: params.authToken ? { Authorization: `Bearer ${params.authToken}` } : undefined
  });

  if (!res.ok) {
    throw new Error(`Failed to load admin products (${res.status})`);
  }

  return adminProductListSchema.parse(await res.json());
}

export async function updateAdminProductMetafields(params: {
  productId: string;
  prompt: string;
  promptMetafieldId?: string | null;
  imageUrl?: string | null;
  imageMetafieldId?: string | null;
  authToken?: string;
}) {
  if (mockApiEnabled) {
    await wait(200);
    return adminMetafieldUpdateSchema.parse({
      promptMetafieldId: params.promptMetafieldId ?? 'mock-prompt',
      imageMetafieldId: params.imageMetafieldId ?? (params.imageUrl ? 'mock-image' : null)
    });
  }

  const { authToken, ...body } = params;
  const res = await fetch(`${backendBaseUrl}/admin/products/${params.productId}/metafields`, {
    method: 'PUT',
    headers: buildJsonHeaders(authToken),
    body: JSON.stringify({
      prompt: body.prompt,
      promptMetafieldId: body.promptMetafieldId ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      imageMetafieldId: body.imageMetafieldId ?? undefined
    })
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Failed to update metafields (${res.status})`);
  }

  const json = await res.json();
  return adminMetafieldUpdateSchema.parse(json);
}

export type AdminProduct = z.infer<typeof adminProductSchema>;
export type AdminProductVariant = z.infer<typeof adminVariantSchema>;
export type AdminSandboxTemplate = z.infer<typeof sandboxTemplateSchema>;
export type AdminActivityItem = z.infer<typeof adminActivityItemSchema>;

export async function fetchSandboxTemplates(params: { authToken?: string } = {}) {
  if (mockApiEnabled) {
    return sandboxTemplateListSchema.parse({
      templates: [
        {
          id: 'demo',
          label: 'Demo Room',
          description: 'A sample living room for testing prompts.',
          thumbnailUrl: mockPreviewPlaceholders[0]
        }
      ]
    });
  }

  const res = await fetch(`${backendBaseUrl}/admin/preview-sandbox/templates`, {
    method: 'GET',
    headers: params.authToken ? { Authorization: `Bearer ${params.authToken}` } : undefined
  });

  if (!res.ok) {
    throw new Error(`Failed to load sandbox templates (${res.status})`);
  }

  const json = await res.json();
  return sandboxTemplateListSchema.parse(json);
}

export async function runSandboxPreview(params: {
  productId: string;
  templateId: string;
  promptOverride?: string;
  variantId?: string;
  authToken?: string;
}) {
  if (mockApiEnabled) {
    await wait(400);
    return sandboxRunResponseSchema.parse({
      previewUrl: randomItem(mockPreviewPlaceholders),
      templateId: params.templateId,
      remaining: 10
    });
  }

  const { authToken, ...body } = params;
  const res = await fetch(`${backendBaseUrl}/admin/preview-sandbox/run`, {
    method: 'POST',
    headers: buildJsonHeaders(authToken),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || `Failed to run sandbox preview (${res.status})`);
  }

  const json = await res.json();
  return sandboxRunResponseSchema.parse(json);
}

export async function fetchAdminActivity(params: { limit?: number; authToken?: string } = {}) {
  if (mockApiEnabled) {
    return adminActivityResponseSchema.parse({
      activity: [
        {
          id: 'mock',
          type: 'sandbox_preview',
          sessionId: null,
          productId: '123',
          productTitle: 'Mock Product',
          shopOrigin: 'mock.shopify.com',
          previewUrl: mockPreviewPlaceholders[1],
          status: 'complete',
          metadata: { templateId: 'demo' },
          createdAt: new Date().toISOString()
        }
      ]
    });
  }

  const url = new URL(`${backendBaseUrl}/admin/activity`);
  if (params.limit) {
    url.searchParams.set('limit', String(params.limit));
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: params.authToken ? { Authorization: `Bearer ${params.authToken}` } : undefined
  });

  if (!res.ok) {
    throw new Error(`Failed to load admin activity (${res.status})`);
  }

  const json = await res.json();
  return adminActivityResponseSchema.parse(json);
}

function buildJsonHeaders(authToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

