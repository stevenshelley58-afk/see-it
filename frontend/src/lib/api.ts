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

function buildJsonHeaders(authToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

