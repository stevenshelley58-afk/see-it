import type { NextWebVitalsMetric } from 'next/app';

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window === 'undefined') return;

  const detail = {
    id: metric.id,
    name: metric.name,
    label: metric.label,
    value: metric.value
  };

  window.dispatchEvent(new CustomEvent('seeit-web-vital', { detail }));

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.dataLayer.push({
    event: 'seeit_web_vital',
    metric_name: metric.name,
    metric_value: metric.value,
    metric_label: metric.label,
    metric_id: metric.id,
    timestamp: Date.now()
  });
}


