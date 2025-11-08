'use client';

import NextImage from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAdminProducts,
  updateAdminProductMetafields,
  type AdminProduct
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

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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
      {!loading && products.length > 0 && (
        <section className="admin-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              authToken={authToken}
              onSaved={handleProductSaved}
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
  onSaved: (productId: string, updates: Partial<AdminProduct>) => void;
};

function ProductCard({ product, authToken, onSaved }: ProductCardProps) {
  const [prompt, setPrompt] = useState(product.prompt ?? '');
  const [imageSelection, setImageSelection] = useState<'none' | 'preset' | 'custom'>('none');
  const [presetUrl, setPresetUrl] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

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
  }, [product]);

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

  const promptCharactersUsed = prompt.length;
  const promptIsValid = prompt.trim().length > 0 && promptCharactersUsed <= PROMPT_LIMIT;
  const customImageIsValid =
    imageSelection !== 'custom' ||
    (customImageUrl.trim().length > 0 && isValidUrl(customImageUrl.trim()));

  const hasChanges =
    prompt.trim() !== (product.prompt ?? '').trim() ||
    (currentImageUrl ?? null) !== (product.imageUrl ?? null);

  const canSave = promptIsValid && customImageIsValid && hasChanges && !saving;

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


