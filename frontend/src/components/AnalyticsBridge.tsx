'use client';

import { useEffect } from 'react';

import { gaMeasurementId, segmentWriteKey } from '../lib/config';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    analytics?: {
      track?: (event: string, properties?: Record<string, unknown>) => void;
      page?: () => void;
    };
  }
}

type AnalyticsDetail = {
  event?: string;
  [key: string]: unknown;
};

export default function AnalyticsBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (gaMeasurementId && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }

    if (segmentWriteKey && window.analytics?.page) {
      window.analytics.page();
    }

    const handler = (rawEvent: Event) => {
      const customEvent = rawEvent as CustomEvent<AnalyticsDetail>;
      const detail = customEvent.detail;
      if (!detail || typeof detail.event !== 'string') {
        return;
      }

      const { event, ...payload } = detail;

      if (gaMeasurementId && typeof window.gtag === 'function') {
        window.gtag('event', event, payload);
      }

      if (segmentWriteKey && window.analytics?.track) {
        window.analytics.track(event, payload);
      }
    };

    window.addEventListener('seeit-analytics', handler as EventListener);
    return () => {
      window.removeEventListener('seeit-analytics', handler as EventListener);
    };
  }, []);

  return null;
}


