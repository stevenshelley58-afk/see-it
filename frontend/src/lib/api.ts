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

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function createSession(params: { productId: string; variantId?: string }) {
  if (mockApiEnabled) {
    await wait(150);
    const uuid =
      typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `mock-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    return { sessionId: uuid };
  }

  const res = await fetch(`${backendBaseUrl}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    throw new Error(`Failed to create session (${res.status})`);
  }

  const json = await res.json();
  return sessionSchema.parse(json);
}

export async function requestSignedUpload(params: { objectName: string; contentType?: string }) {
  if (mockApiEnabled) {
    await wait(120);
    return {
      url: 'mock://upload',
      fields: {},
      gcsUrl: `gs://mock/${params.objectName}`
    };
  }

  const res = await fetch(`${backendBaseUrl}/uploads/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
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
}) {
  if (mockApiEnabled) {
    await wait(600);
    return {
      status: 'complete',
      previewUrl: randomItem(mockPreviewPlaceholders),
      promptUsed: undefined
    };
  }

  const res = await fetch(`${backendBaseUrl}/generate-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    throw new Error(`Failed to generate preview (${res.status})`);
  }

  const json = await res.json();
  return previewResponseSchema.parse(json);
}

export async function sendSessionEmail(params: { sessionId: string; email: string }) {
  if (mockApiEnabled) {
    await wait(300);
    return emailResponseSchema.parse({ status: 'sent' });
  }

  const res = await fetch(`${backendBaseUrl}/send-session-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    throw new Error(`Failed to send session email (${res.status})`);
  }

  const json = await res.json();
  return emailResponseSchema.parse(json);
}

