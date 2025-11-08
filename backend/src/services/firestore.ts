import { Firestore, FieldValue } from '@google-cloud/firestore';
import { logger } from '../logger.js';

const projectId = process.env.GCP_PROJECT_ID;
const db = new Firestore(
  projectId
    ? {
        projectId
      }
    : undefined
);

const sessionsCollection = db.collection('sessions');

type SessionInit = {
  productId: string;
  productTitle?: string;
  variantId?: string;
};

export const firestore = {
  async ensureSession(sessionId: string, init: SessionInit) {
    const ref = sessionsCollection.doc(sessionId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      await ref.set({
        createdAt: new Date(),
        productId: init.productId,
        productTitle: init.productTitle ?? null,
        variantId: init.variantId ?? null,
        generatedImageURLs: []
      });
      logger.debug({ sessionId }, 'Created session');
    }
  },

  async appendGeneratedImage(sessionId: string, generatedImageUrl: string) {
    const ref = sessionsCollection.doc(sessionId);
    await ref.update({
      generatedImageURLs: FieldValue.arrayUnion(generatedImageUrl),
      updatedAt: new Date()
    });
  },

  async saveEmail(sessionId: string, email: string) {
    const ref = sessionsCollection.doc(sessionId);
    await ref.update({
      email,
      emailCapturedAt: new Date()
    });
  },

  async getSession(sessionId: string) {
    const ref = sessionsCollection.doc(sessionId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return null;
    }
    return snapshot.data();
  }
};

