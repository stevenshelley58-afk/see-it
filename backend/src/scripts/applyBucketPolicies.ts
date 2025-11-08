import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { Storage } from '@google-cloud/storage';

import { logger } from '../logger.js';

const projectId = process.env.GCP_PROJECT_ID;
const bucketName = process.env.GCS_BUCKET_NAME;

function parseOrigins(): string[] {
  const configured =
    process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
  const storefront =
    process.env.STOREFRONT_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  return Array.from(new Set(configured.concat(storefront)));
}

async function loadJson<T>(relativePath: string): Promise<T> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const absolutePath = path.resolve(scriptDir, '../../..', relativePath);
  const file = await readFile(absolutePath, 'utf8');
  return JSON.parse(file) as T;
}

async function applyPolicies() {
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID is required to update bucket policies');
  }
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is required to update bucket policies');
  }

  const storage = new Storage({ projectId });
  const bucket = storage.bucket(bucketName);

  type LifecycleConfig = {
    rule: Array<{
      action: { type: string };
      condition: Record<string, unknown>;
    }>;
  };

  type CorsRule = {
    origin: string[];
    method: string[];
    responseHeader?: string[];
    maxAgeSeconds?: number;
  };

  const lifecycle = await loadJson<LifecycleConfig>('docs/snippets/gcs-lifecycle.json');
  const corsConfig = await loadJson<CorsRule[]>('docs/snippets/gcs-cors.json');

  const origins = parseOrigins();
  if (origins.length) {
    if (corsConfig.length === 0) {
      corsConfig.push({
        origin: origins,
        method: ['GET', 'HEAD', 'POST', 'OPTIONS'],
        responseHeader: ['Content-Type'],
        maxAgeSeconds: 3600
      });
    } else {
      corsConfig[0] = {
        ...corsConfig[0],
        origin: origins
      };
    }
  }

  await bucket.setMetadata({
    cors: corsConfig as unknown as Record<string, unknown>[],
    lifecycle: lifecycle as unknown as Record<string, unknown>
  });

  logger.info(
    { origins, lifecycleRules: lifecycle.rule?.length ?? 0 },
    'Applied bucket CORS and lifecycle policies'
  );
}

applyPolicies().catch((error) => {
  logger.error({ err: error }, 'Failed to apply bucket policies');
  process.exitCode = 1;
});

