import { VertexAI, type GenerateContentCandidate, type Part } from '@google-cloud/vertexai';

import { downloadObject, uploadObject } from './storage.js';
import { generatePlacementMask } from './mask.js';
import { parseGcsUrl } from '../utils/gcs.js';
import { logger } from '../logger.js';

const project = process.env.GCP_PROJECT_ID;
const location = process.env.VERTEX_LOCATION ?? 'us-central1';
const modelName = process.env.VERTEX_MODEL ?? 'publishers/google/models/gemini-2.5-flash-image';
const outputBucket = process.env.GCS_BUCKET_NAME;

type Placement = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

const vertex = project ? new VertexAI({ project, location }) : undefined;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generatePreviewImage(params: {
  roomImageUrl: string;
  productPrompt: string;
  placement: Placement;
}) {
  if (!vertex) {
    throw new Error('Vertex AI not configured (missing GCP_PROJECT_ID)');
  }

  if (!outputBucket) {
    throw new Error('Missing GCS_BUCKET_NAME for output storage');
  }

  const { roomImageUrl, productPrompt, placement } = params;
  const { bucket, object } = parseGcsUrl(roomImageUrl);
  const roomImage = await downloadObject(bucket, object);
  const maskBuffer = await generatePlacementMask(roomImage, placement);

  const generativeModel = vertex.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.4
    }
  });

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await generativeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: productPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: roomImage.toString('base64')
                }
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: maskBuffer.toString('base64')
                }
                // TODO: migrate to explicit mask field when SDK exposes helper.
              }
            ]
          }
        ],
        safetySettings: []
      });

      const candidates = result.response.candidates ?? [];
      const imagePart = candidates
        .flatMap((candidate: GenerateContentCandidate) => candidate.content.parts ?? [])
        .find((part: Part) => part.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart?.inlineData?.data) {
        throw new Error('Vertex AI response missing image');
      }

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const objectName = `${object.replace(/\.[^.]+$/, '')}-preview-${Date.now()}.jpg`;
      return uploadObject(outputBucket, objectName, imageBuffer, 'image/jpeg');
    } catch (error) {
      lastError = error;
      logger.warn(
        { err: error, attempt, sessionRoomObject: object },
        'Vertex AI generation attempt failed'
      );
      if (attempt < maxAttempts) {
        await wait(400 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to generate preview');
}

