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
const activityCollection = db.collection('activity');
const sandboxUsageCollection = db.collection('sandboxUsage');

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
  },

  async recordActivity(event: {
    type: 'preview_generated' | 'preview_failed' | 'email_sent' | 'sandbox_preview';
    sessionId?: string | null;
    productId?: string | null;
    productTitle?: string | null;
    shopOrigin?: string | null;
    previewUrl?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await activityCollection.add({
      ...event,
      createdAt: new Date()
    });
  },

  async listRecentActivity(params: { shopOrigin: string; limit?: number }) {
    const query = activityCollection
      .where('shopOrigin', '==', params.shopOrigin)
      .orderBy('createdAt', 'desc')
      .limit(Math.max(1, Math.min(params.limit ?? 25, 50)));
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }));
  },

  async getSandboxUsage(shopOrigin: string, dateKey: string) {
    const ref = sandboxUsageCollection.doc(`${shopOrigin}#${dateKey}`);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return { count: 0 };
    }
    const data = snapshot.data();
    const count = typeof data?.count === 'number' ? data.count : 0;
    return { count };
  },

  async incrementSandboxUsage(shopOrigin: string, dateKey: string) {
    const ref = sandboxUsageCollection.doc(`${shopOrigin}#${dateKey}`);
    await ref.set(
      {
        shopOrigin,
        dateKey,
        count: FieldValue.increment(1),
        updatedAt: new Date()
      },
      { merge: true }
    );
  }
};

