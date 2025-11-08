import { Firestore } from '@google-cloud/firestore';

import { logger } from '../logger.js';

const projectId = process.env.GCP_PROJECT_ID;
const retentionDays = Number.parseInt(process.env.SESSION_RETENTION_DAYS ?? '30', 10);
const batchSize = Number.parseInt(process.env.SESSION_PURGE_BATCH_SIZE ?? '400', 10);

function getCutoffDate(days: number) {
  const now = Date.now();
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

async function purgeStaleSessions() {
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID is required to purge Firestore sessions.');
  }

  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    throw new Error('SESSION_RETENTION_DAYS must be a positive integer.');
  }

  const db = new Firestore({ projectId });
  const cutoff = getCutoffDate(retentionDays);
  let totalDeleted = 0;

  logger.info({ cutoff: cutoff.toISOString(), retentionDays }, 'Purging Firestore sessions');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await db
      .collection('sessions')
      .where('createdAt', '<', cutoff)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snapshot.size;
    logger.info({ deleted: snapshot.size, totalDeleted }, 'Deleted batch of expired sessions');
  }

  logger.info({ totalDeleted }, 'Firestore session purge complete');
}

purgeStaleSessions().catch((error) => {
  logger.error({ err: error }, 'Firestore session purge failed');
  process.exitCode = 1;
});

