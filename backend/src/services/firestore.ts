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
  productTitle?: string | null;
  variantId?: string | null;
  shopOrigin?: string | null;
  locale?: string | null;
};

export const firestore = {
  async ensureSession(sessionId: string, init: SessionInit) {
    const ref = sessionsCollection.doc(sessionId);
    const snapshot = await ref.get();

    const baseData = {
      productId: init.productId,
      productTitle: init.productTitle ?? null,
      variantId: init.variantId ?? null,
      shopOrigin: init.shopOrigin ?? null,
      locale: init.locale ?? null
    };

    if (!snapshot.exists) {
      await ref.set({
        ...baseData,
        createdAt: new Date(),
        generatedImageURLs: []
      });
      logger.debug({ sessionId }, 'Created session');
    } else {
      await ref.update({
        ...baseData,
        updatedAt: new Date()
      });
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

