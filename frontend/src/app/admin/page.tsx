'use client';

import NextImage from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAdminProducts,
  fetchAdminActivity,
  fetchSandboxTemplates,
  runSandboxPreview,
  updateAdminProductMetafields,
  type AdminProduct,
  type AdminSandboxTemplate,
  type AdminActivityItem
} from '../../lib/api';
import { fetchSessionToken } from '../../lib/shopifyBridge';

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

const PROMPT_LIMIT = 500;

export default function AdminMetafieldsPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ hasNextPage: false, endCursor: null });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const [sandboxTemplates, setSandboxTemplates] = useState<AdminSandboxTemplate[]>([]);
  const [sandboxTemplatesLoading, setSandboxTemplatesLoading] = useState(false);
  const [sandboxTemplatesError, setSandboxTemplatesError] = useState<string | null>(null);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    setTokenRefreshing(true);
    try {
      const token = await fetchSessionToken();
      setAuthToken(token);
      return token;
    } finally {
      setTokenRefreshing(false);
    }
  }, []);

  const resolveAuthToken = useCallback(async () => {
    if (authToken) {
      return authToken;
    }
    return await refreshToken();
  }, [authToken, refreshToken]);

  const loadProducts = useCallback(
    async (options: { after?: string | null; append?: boolean } = {}) => {
      setError(null);
      const targetState = options.append ? setLoadingMore : setLoading;
      targetState(true);
      try {
        const token = options.append ? authToken ?? (await refreshToken()) : await refreshToken();
        const response = await fetchAdminProducts({
          after: options.after ?? undefined,
          authToken: token ?? undefined
        });
        setPageInfo(response.pageInfo);
        setProducts((prev) =>
          options.append ? [...prev, ...response.products] : response.products
        );
      } catch (err) {
        setError((err as Error)?.message ?? 'We could not load products from Shopify.');
      } finally {
        targetState(false);
      }
    },
    [authToken, refreshToken]
  );

  const loadSandboxTemplates = useCallback(async () => {
    if (sandboxTemplatesLoading) {
      return;
    }
    setSandboxTemplatesError(null);
    setSandboxTemplatesLoading(true);
    try {
      const token = await resolveAuthToken();
      if (!token) {
        throw new Error('Missing Shopify session token');
      }
      const response = await fetchSandboxTemplates({ authToken: token });
      setSandboxTemplates(response.templates);
    } catch (err) {
      setSandboxTemplatesError(
        (err as Error)?.message ?? 'Unable to load sandbox templates right now.'
      );
    } finally {
      setSandboxTemplatesLoading(false);
    }
  }, [resolveAuthToken, sandboxTemplatesLoading]);

  const loadActivity = useCallback(async () => {
    setActivityError(null);
    setActivityLoading(true);
    try {
      const token = await resolveAuthToken();
      if (!token) {
        throw new Error('Missing Shopify session token');
      }
      const response = await fetchAdminActivity({ authToken: token, limit: 25 });
      setActivity(response.activity);
    } catch (err) {
      setActivityError((err as Error)?.message ?? 'Unable to load recent activity.');
    } finally {
      setActivityLoading(false);
    }
  }, [resolveAuthToken]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!authToken) return;
    void loadSandboxTemplates();
    void loadActivity();
  }, [authToken, loadActivity, loadSandboxTemplates]);

  const handleLoadMore = useCallback(() => {
    if (!pageInfo.hasNextPage || loadingMore) return;
    void loadProducts({ after: pageInfo.endCursor ?? undefined, append: true });
  }, [loadProducts, loadingMore, pageInfo.endCursor, pageInfo.hasNextPage]);

  const handleProductSaved = useCallback(
    (productId: string, updates: Partial<AdminProduct>) => {
      setProducts((prev) =>
        prev.map((product) => (product.id === productId ? { ...product, ...updates } : product))
      );
    },
    []
  );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>See It Metafields</h1>
          <p>
            Review prompts and hero imagery before publishing. This dashboard writes to the
            <code> custom.see_it_prompt </code>and<code> custom.see_it_image </code>metafields so
            storefront shoppers get polished previews.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-tertiary admin-refresh"
            onClick={() => void loadProducts()}
            disabled={loading || tokenRefreshing}
          >
            {tokenRefreshing ? 'Refreshing…' : 'Reload'}
          </button>
        </div>
      </header>
      {!authToken && !loading && (
        <div className="admin-alert">
          Launch this page from the Shopify admin so we can authenticate with the current session
          token.
        </div>
      )}
      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          {error}
        </div>
      )}
      {sandboxTemplatesError && (
        <div className="admin-alert admin-alert-warning" role="status">
          {sandboxTemplatesError}
        </div>
      )}
      {loading && (
        <div className="admin-placeholder">
          <div className="skeleton admin-skeleton-card" aria-hidden="true" />
          <div className="skeleton admin-skeleton-card" aria-hidden="true" />
          <div className="skeleton admin-skeleton-card" aria-hidden="true" />
        </div>
      )}
      {!loading && products.length === 0 && !error && (
        <div className="admin-empty">
          <h2>No products found</h2>
          <p>Add products to your Shopify catalog, then refresh this page.</p>
        </div>
      )}
      {authToken && (
        <ActivityTimeline
          items={activity}
          loading={activityLoading}
          error={activityError}
          onRefresh={() => void loadActivity()}
        />
      )}
      {!loading && products.length > 0 && (
        <section className="admin-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              authToken={authToken}
              onSaved={handleProductSaved}
              sandboxTemplates={sandboxTemplates}
              sandboxTemplatesLoading={sandboxTemplatesLoading}
              resolveAuthToken={resolveAuthToken}
              onRefreshActivity={() => void loadActivity()}
            />
          ))}
        </section>
      )}
      {pageInfo.hasNextPage && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more products'}
          </button>
        </div>
      )}
    </main>
  );
}

type ProductCardProps = {
  product: AdminProduct;
  authToken: string | null;
  sandboxTemplates: AdminSandboxTemplate[];
  sandboxTemplatesLoading: boolean;
  resolveAuthToken: () => Promise<string | null>;
  onSaved: (productId: string, updates: Partial<AdminProduct>) => void;
  onRefreshActivity: () => void;
};

function ProductCard({
  product,
  authToken,
  sandboxTemplates,
  sandboxTemplatesLoading,
  resolveAuthToken,
  onSaved,
  onRefreshActivity
}: ProductCardProps) {
  const [prompt, setPrompt] = useState(product.prompt ?? '');
  const [imageSelection, setImageSelection] = useState<'none' | 'preset' | 'custom'>('none');
  const [presetUrl, setPresetUrl] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sandboxTemplateId, setSandboxTemplateId] = useState<string | null>(null);
  const [sandboxPreviewUrl, setSandboxPreviewUrl] = useState<string | null>(null);
  const [sandboxRemaining, setSandboxRemaining] = useState<number | null>(null);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  useEffect(() => {
    setPrompt(product.prompt ?? '');
    const options = buildImageOptions(product);
    if (product.imageUrl) {
      const matchedOption = options.find((option) => option.url === product.imageUrl);
      if (matchedOption) {
        setImageSelection('preset');
        setPresetUrl(matchedOption.url);
        setCustomImageUrl('');
      } else {
        setImageSelection('custom');
        setPresetUrl(null);
        setCustomImageUrl(product.imageUrl);
      }
    } else {
      setImageSelection('none');
      setPresetUrl(null);
      setCustomImageUrl('');
    }
    setSaveError(null);
    setSavedAt(null);
    setSandboxPreviewUrl(null);
    setSandboxRemaining(null);
    setSandboxError(null);
    setSandboxRunning(false);
  }, [product]);

  useEffect(() => {
    if (!sandboxTemplates.length) {
      setSandboxTemplateId(null);
      return;
    }
    setSandboxTemplateId((prev) =>
      prev && sandboxTemplates.some((template) => template.id === prev)
        ? prev
        : sandboxTemplates[0]?.id ?? null
    );
  }, [sandboxTemplates]);

  useEffect(() => {
    setSandboxError(null);
    setSandboxPreviewUrl(null);
  }, [sandboxTemplateId]);

  const imageOptions = useMemo(() => buildImageOptions(product), [product]);

  const currentImageUrl = useMemo(() => {
    if (imageSelection === 'preset') {
      return presetUrl;
    }
    if (imageSelection === 'custom') {
      const trimmed = customImageUrl.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }, [customImageUrl, imageSelection, presetUrl]);

  const selectedSandboxTemplate = useMemo(
    () => sandboxTemplates.find((template) => template.id === sandboxTemplateId) ?? null,
    [sandboxTemplateId, sandboxTemplates]
  );

  const promptCharactersUsed = prompt.length;
  const promptIsValid = prompt.trim().length > 0 && promptCharactersUsed <= PROMPT_LIMIT;
  const customImageIsValid =
    imageSelection !== 'custom' ||
    (customImageUrl.trim().length > 0 && isValidUrl(customImageUrl.trim()));

  const hasChanges =
    prompt.trim() !== (product.prompt ?? '').trim() ||
    (currentImageUrl ?? null) !== (product.imageUrl ?? null);

  const canSave = promptIsValid && customImageIsValid && hasChanges && !saving;

  const handleSandboxRun = useCallback(async () => {
    if (!sandboxTemplateId || sandboxTemplatesLoading) {
      return;
    }
    if (!promptIsValid) {
      setSandboxError('Enter a prompt before running the sandbox.');
      return;
    }
    setSandboxRunning(true);
    setSandboxError(null);
    try {
      const token = await resolveAuthToken();
      if (!token) {
        throw new Error('Missing Shopify session token');
      }
      const response = await runSandboxPreview({
        productId: product.id,
        templateId: sandboxTemplateId,
        promptOverride: prompt.trim(),
        authToken: token
      });
      setSandboxPreviewUrl(response.previewUrl);
      setSandboxRemaining(response.remaining);
      void onRefreshActivity();
    } catch (err) {
      setSandboxError((err as Error)?.message ?? 'Unable to run sandbox preview.');
    } finally {
      setSandboxRunning(false);
    }
  }, [
    sandboxTemplateId,
    sandboxTemplatesLoading,
    promptIsValid,
    resolveAuthToken,
    product.id,
    prompt,
    onRefreshActivity
  ]);

  const handleSelectionChange = (value: string) => {
    if (value === 'custom') {
      setImageSelection('custom');
      setPresetUrl(null);
    } else if (value === 'none') {
      setImageSelection('none');
      setPresetUrl(null);
      setCustomImageUrl('');
    } else {
      setImageSelection('preset');
      setPresetUrl(value);
      setCustomImageUrl('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const imageUrl =
        imageSelection === 'none' ? null : imageSelection === 'preset' ? presetUrl : currentImageUrl;
      const response = await updateAdminProductMetafields({
        productId: product.id,
        prompt: prompt.trim(),
        promptMetafieldId: product.promptMetafieldId ?? undefined,
        imageUrl: imageUrl ?? undefined,
        imageMetafieldId: product.imageMetafieldId ?? undefined,
        authToken: authToken ?? undefined
      });

      onSaved(product.id, {
        prompt: prompt.trim(),
        promptMetafieldId: response.promptMetafieldId,
        imageUrl: imageUrl ?? null,
        imageMetafieldId: response.imageMetafieldId
      });
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError((err as Error)?.message ?? 'Unable to save metafields right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="admin-card">
      <header className="admin-card-header">
        <div>
          <h2>{product.title}</h2>
          <span className={`admin-status admin-status-${product.status.toLowerCase()}`}>
            {product.status.toLowerCase()}
          </span>
        </div>
        {product.featuredImageUrl && (
          <div className="admin-card-thumb">
            <NextImage
              src={product.featuredImageUrl}
              alt={`${product.title} featured`}
              width={96}
              height={96}
            />
          </div>
        )}
      </header>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          <span className="admin-label">
            Prompt
            <small>
              {promptCharactersUsed}/{PROMPT_LIMIT}
            </small>
          </span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={PROMPT_LIMIT}
            className="admin-textarea"
            rows={4}
            placeholder="Describe how the product should appear in the shopper’s photo."
          />
        </label>
        {!promptIsValid && (
          <p className="admin-helper admin-helper-error">
            Prompts must be between 1 and {PROMPT_LIMIT} characters.
          </p>
        )}
        <label>
          <span className="admin-label">Hero image</span>
          <select
            className="admin-select"
            value={
              imageSelection === 'custom'
                ? 'custom'
                : imageSelection === 'none'
                ? 'none'
                : presetUrl ?? 'none'
            }
            onChange={(event) => handleSelectionChange(event.target.value)}
          >
            <option value="none">Use product featured image</option>
            {imageOptions.map((option) => (
              <option key={option.url} value={option.url}>
                {option.label}
              </option>
            ))}
            <option value="custom">Custom image URL…</option>
          </select>
        </label>
        {imageSelection === 'custom' && (
          <label>
            <span className="admin-label">Custom image URL</span>
            <input
              type="url"
              className="admin-input"
              value={customImageUrl}
              onChange={(event) => setCustomImageUrl(event.target.value)}
              placeholder="https://"
            />
          </label>
        )}
        {!customImageIsValid && (
          <p className="admin-helper admin-helper-error">Enter a valid HTTPS image URL.</p>
        )}
        {currentImageUrl && (
          <div className="admin-preview">
            <NextImage src={currentImageUrl} alt="Selected hero" width={160} height={160} />
          </div>
        )}
        {saveError && (
          <p className="admin-helper admin-helper-error" role="alert">
            {saveError}
          </p>
        )}
        {savedAt && !saveError && (
          <p className="admin-helper admin-helper-success">
            Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
          </p>
        )}
        <div className="admin-actions">
          <div className="admin-meta">
            <small>{product.totalVariants} variants</small>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </form>
      <section className="admin-sandbox">
        <div className="admin-sandbox-header">
          <h3>Preview sandbox</h3>
          {sandboxTemplatesLoading && <span className="admin-pill">Loading…</span>}
        </div>
        <p className="admin-helper">
          Generate a sample preview using staged room templates. This does not impact your live
          storefront.
        </p>
        {sandboxTemplatesLoading && sandboxTemplates.length === 0 && (
          <div className="skeleton admin-sandbox-skeleton" aria-hidden="true" />
        )}
        {!sandboxTemplatesLoading && sandboxTemplates.length === 0 && (
          <p className="admin-helper">Add sandbox templates to enable quick previewing.</p>
        )}
        {sandboxTemplates.length > 0 && (
          <>
            <label>
              <span className="admin-label">Template</span>
              <select
                className="admin-select"
                value={sandboxTemplateId ?? ''}
                onChange={(event) => setSandboxTemplateId(event.target.value || null)}
              >
                {sandboxTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedSandboxTemplate?.description && (
              <p className="admin-helper">{selectedSandboxTemplate.description}</p>
            )}
            {selectedSandboxTemplate?.thumbnailUrl && (
              <div className="admin-sandbox-thumbnail">
                <NextImage
                  src={selectedSandboxTemplate.thumbnailUrl}
                  alt={`${selectedSandboxTemplate.label} preview`}
                  width={180}
                  height={120}
                />
              </div>
            )}
            <div className="admin-sandbox-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void handleSandboxRun()}
                disabled={sandboxRunning || sandboxTemplatesLoading || !sandboxTemplateId}
              >
                {sandboxRunning ? 'Generating…' : 'Run sandbox preview'}
              </button>
              {typeof sandboxRemaining === 'number' && (
                <small className="admin-meta">
                  Remaining today: {Math.max(0, sandboxRemaining)}
                </small>
              )}
            </div>
            {sandboxError && (
              <p className="admin-helper admin-helper-error" role="alert">
                {sandboxError}
              </p>
            )}
            {sandboxPreviewUrl && (
              <div className="admin-sandbox-preview">
                <NextImage
                  src={sandboxPreviewUrl}
                  alt="Sandbox preview result"
                  width={240}
                  height={240}
                  className="admin-sandbox-preview-image"
                />
                <a
                  href={sandboxPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-link"
                >
                  Open full preview
                </a>
              </div>
            )}
          </>
        )}
      </section>
    </article>
  );
}

function buildImageOptions(product: AdminProduct) {
  const entries = new Map<string, string>();
  if (product.featuredImageUrl) {
    entries.set(product.featuredImageUrl, 'Featured image');
  }
  product.variants.forEach((variant, index) => {
    if (variant.imageUrl) {
      entries.set(variant.imageUrl, `Variant: ${variant.title || `Option ${index + 1}`}`);
    }
  });
  if (product.imageUrl && !entries.has(product.imageUrl)) {
    entries.set(product.imageUrl, 'Current See It image');
  }
  return Array.from(entries.entries()).map(([url, label]) => ({ url, label }));
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

type ActivityTimelineProps = {
  items: AdminActivityItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function ActivityTimeline({ items, loading, error, onRefresh }: ActivityTimelineProps) {
  const hasItems = items.length > 0;
  return (
    <section className="admin-activity">
      <article className="admin-card admin-activity-card">
        <header className="admin-card-header">
          <div>
            <h2>Activity timeline</h2>
            <p>Recent previews, sandbox runs, and emails for your store.</p>
          </div>
          <button
            type="button"
            className="btn btn-tertiary"
            onClick={() => void onRefresh()}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>
        {error && (
          <p className="admin-helper admin-helper-error" role="alert">
            {error}
          </p>
        )}
        {loading && (
          <div className="skeleton admin-skeleton-activity" aria-hidden="true">
            &nbsp;
          </div>
        )}
        {!loading && !error && !hasItems && (
          <p className="admin-helper">Run a sandbox preview or publish updates to see history.</p>
        )}
        {hasItems && (
          <ul className="admin-activity-list">
            {items.map((item, index) => {
              const templateId =
                item.metadata &&
                typeof item.metadata === 'object' &&
                item.metadata !== null &&
                'templateId' in item.metadata
                  ? String((item.metadata as Record<string, unknown>).templateId ?? '')
                  : null;
              return (
                <li key={item.id ?? `${item.type}-${item.createdAt ?? index}`}>
                  <div className="admin-activity-row">
                    <span className="admin-activity-type">{formatActivityType(item.type)}</span>
                    <span className="admin-activity-time">
                      {formatActivityTimestamp(item.createdAt)}
                    </span>
                  </div>
                  {item.productTitle && (
                    <p className="admin-meta">
                      {item.productTitle}
                      {templateId ? ` · Template ${templateId}` : ''}
                    </p>
                  )}
                  {!item.productTitle && templateId && (
                    <p className="admin-meta">Template {templateId}</p>
                  )}
                  {item.previewUrl && (
                    <a
                      href={item.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-link"
                    >
                      View preview
                    </a>
                  )}
                  {item.status && (
                    <p className="admin-meta admin-activity-status">Status: {item.status}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
}

function formatActivityTimestamp(timestamp: string | null) {
  if (!timestamp) return '—';
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }
  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatActivityType(type: string | undefined) {
  switch (type) {
    case 'sandbox_preview':
      return 'Sandbox preview';
    case 'preview_generated':
      return 'Preview generated';
    case 'preview_failed':
      return 'Preview failed';
    case 'email_sent':
      return 'Email sent';
    default:
      return type ?? 'Event';
  }
}


