type AnalyticsEvent =
  | 'cta_click'
  | 'photo_captured'
  | 'photo_cropped'
  | 'placement_submitted'
  | 'preview_generated'
  | 'preview_failed'
  | 'email_sent'
  | 'guides_toggle';

type Payload = Record<string, unknown>;

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

function emit(event: AnalyticsEvent, payload: Payload = {}) {
  if (typeof window === 'undefined') return;
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dispatchEvent(
    new CustomEvent('seeit-analytics', { detail: { event, ...payload } })
  );
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.dataLayer.push({
    event: `seeit_${event}`,
    ...payload,
    timestamp: Date.now()
  });
  // eslint-disable-next-line no-console
  console.debug('[analytics]', event, payload);
}

export const analytics = {
  track: emit
};

