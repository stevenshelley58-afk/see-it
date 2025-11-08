import { Storage, type SignedPostPolicyV4Output } from '@google-cloud/storage';

export const storage = new Storage();
const signedUploadCache = new Map<string, { expiresAt: number; payload: SignedPostPolicyV4Output }>();

export async function createSignedUpload(params: { bucket: string; objectName: string; expiresInSeconds?: number }) {
  const { bucket, objectName, expiresInSeconds = 300 } = params;
  const cacheKey = `${bucket}/${objectName}`;
  const cached = signedUploadCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const [policy] = await storage
    .bucket(bucket)
    .file(objectName)
    .generateSignedPostPolicyV4({
      expires: new Date(now + expiresInSeconds * 1000),
      fields: {
        success_action_status: '201'
      },
      conditions: [
        ['content-length-range', 0, 5 * 1024 * 1024]
      ]
    });

  const cacheTtlMs = Math.floor(expiresInSeconds * 1000 * 0.8);
  signedUploadCache.set(cacheKey, { expiresAt: now + cacheTtlMs, payload: policy });
  return policy;
}

export async function downloadObject(bucket: string, objectName: string) {
  const [buffer] = await storage.bucket(bucket).file(objectName).download();
  return buffer;
}

export async function uploadObject(bucket: string, objectName: string, data: Buffer, contentType: string) {
  const file = storage.bucket(bucket).file(objectName);
  await file.save(data, {
    resumable: false,
    contentType,
    public: true,
    metadata: {
      cacheControl: 'public, max-age=31536000'
    }
  });
  const [metadata] = await file.getMetadata();
  return `https://storage.googleapis.com/${bucket}/${objectName}?v=${metadata.generation}`;
}

