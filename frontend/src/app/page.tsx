/* eslint-disable jsx-a11y/media-has-caption */
'use client';

import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createSession, requestGeneratedPreview, requestSignedUpload, sendSessionEmail } from '../lib/api';
import { analytics } from '../lib/analytics';
import { mockApiEnabled } from '../lib/config';
import { dataUrlToFile, downscaleImage } from '../lib/image';

type Step = 'welcome' | 'crop' | 'placement' | 'loading' | 'preview' | 'email';

type Placement = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

const product = {
  id: 'gid://shopify/Product/123456789',
  title: 'Modern Velvet Armchair',
  price: '$499',
  image:
    'https://images.unsplash.com/photo-1616628182501-0bbcfd084d94?auto=format&fit=crop&w=600&q=80'
};

const defaultPlacement: Placement = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
};

export default function HomePage() {
  const mockMode = mockApiEnabled;
  const [step, setStep] = useState<Step>('welcome');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rawRoomPhoto, setRawRoomPhoto] = useState<string | null>(null);
  const [croppedRoomPhoto, setCroppedRoomPhoto] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>(defaultPlacement);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const handleCreateSession = useCallback(async () => {
    if (sessionId) return sessionId;
    try {
      const res = await createSession({ productId: product.id });
      setSessionId(res.sessionId);
      return res.sessionId;
    } catch (error) {
      console.warn('Falling back to local session', error);
      const uuid = crypto.randomUUID();
      setSessionId(uuid);
      return uuid;
    }
  }, [sessionId]);

  const onPhotoSelected = useCallback(
    async (file: File) => {
      const fileReader = new FileReader();
      return new Promise<void>((resolve, reject) => {
        fileReader.onload = () => {
          const result = fileReader.result as string;
          setRawRoomPhoto(result);
          setStep('crop');
          resolve();
        };
        fileReader.onerror = () => reject(fileReader.error);
        fileReader.readAsDataURL(file);
      });
    },
    []
  );

  const onConfirmCrop = useCallback(
    async (croppedDataUrl: string) => {
      const downscaled = await downscaleImage(croppedDataUrl, 1024);
      setCroppedRoomPhoto(downscaled);
      analytics.track('photo_cropped');
      setPlacement(defaultPlacement);
      setStep('placement');
    },
    []
  );

  const onGeneratePreview = useCallback(async () => {
    if (!croppedRoomPhoto) return;
    setStep('loading');
    const session = await handleCreateSession();
    analytics.track('placement_submitted', { sessionId: session });
    try {
      const objectName = `${session}/room-${Date.now()}.jpg`;
      const signed = await requestSignedUpload({
        objectName
      });

      if (!mockMode) {
        const file = dataUrlToFile(croppedRoomPhoto, 'room.jpg');
        const formData = new FormData();
        for (const key of Object.keys(signed.fields)) {
          formData.append(key, signed.fields[key]);
        }
        formData.append('file', file, file.name);

        await fetch(signed.url, {
          method: 'POST',
          body: formData
        });
      }

      const preview = await requestGeneratedPreview({
        sessionId: session,
        roomImageGcsUrl: signed.gcsUrl,
        productId: product.id,
        placement
      });

      setPreviewError(null);
      setPreviewUrl(preview.previewUrl);
      setPreviewHistory((prev) => Array.from(new Set([...prev, preview.previewUrl])));
      analytics.track('preview_generated', { sessionId: session });
      setStep('preview');
    } catch (error) {
      console.warn('Falling back to local preview', error);
      setPreviewError('We saved your placement, but the preview is a quick mock. Try again soon for the full result.');
      setPreviewUrl(croppedRoomPhoto);
      setPreviewHistory((prev) => Array.from(new Set([...prev, croppedRoomPhoto])));
      analytics.track('preview_failed', { message: (error as Error)?.message });
      setStep('preview');
    }
  }, [croppedRoomPhoto, handleCreateSession, mockMode, placement]);

  const onAdjust = () => {
    analytics.track('cta_click', { action: 'adjust_preview' });
    setStep('placement');
  };

  const onBackToStore = () => {
    analytics.track('cta_click', { action: 'back_to_store' });
    setEmailModalOpen(true);
    setStep('email');
  };

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <TopBar productTitle={product.title} onClose={onBackToStore} />
        {step === 'welcome' && (
          <StepWelcome productTitle={product.title} onSelectFile={onPhotoSelected} />
        )}
        {step === 'crop' && rawRoomPhoto && (
          <StepCrop source={rawRoomPhoto} onConfirm={onConfirmCrop} onBack={() => setStep('welcome')} />
        )}
        {step === 'placement' && croppedRoomPhoto && (
          <StepPlacement
            background={croppedRoomPhoto}
            productImage={product.image}
            placement={placement}
            onPlacementChange={setPlacement}
            onGeneratePreview={onGeneratePreview}
            onBack={() => setStep('crop')}
          />
        )}
        {step === 'loading' && <StepLoading />}
        {step === 'preview' && previewUrl && (
          <StepPreview
            previewUrl={previewUrl}
            productTitle={product.title}
            errorMessage={previewError}
            history={previewHistory}
            onSelectHistory={setPreviewUrl}
            onAdjust={onAdjust}
            onBackToStore={onBackToStore}
          />
        )}
        {emailModalOpen && (
          <EmailModal
            sessionId={sessionId}
            onClose={() => {
              setEmailModalOpen(false);
              setStep('welcome');
            }}
          />
        )}
      </div>
    </main>
  );
}

type StepWelcomeProps = {
  productTitle: string;
  onSelectFile: (file: File) => Promise<void>;
};

function StepWelcome({ productTitle, onSelectFile }: StepWelcomeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (capture: boolean) => {
    analytics.track('cta_click', { action: capture ? 'take_photo' : 'upload_photo' });
    const ref = capture ? fileInputRef : uploadInputRef;
    ref.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analytics.track('photo_captured', { source: event.target.capture ? 'camera' : 'library' });
      await onSelectFile(file);
      event.target.value = '';
    }
  };

  return (
    <section className="screen">
      <div className="carousel">
        <img
          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=60"
          alt="Living room inspiration"
        />
        <div className="carousel-caption">
          <h2>See it in your home</h2>
          <p>Snap your space and we blend the product for you.</p>
        </div>
      </div>
      <div className="screen-content">
        <h1>See {productTitle} in your home.</h1>
        <p className="body-text">
          Take a quick photo or upload one from your library. You’ll add the product in the next step.
        </p>
      </div>
      <div className="button-stack">
        <button className="btn btn-primary" onClick={() => handleClick(true)}>
          Take Photo
        </button>
        <button className="btn btn-secondary" onClick={() => handleClick(false)}>
          Upload Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleChange}
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleChange}
        />
      </div>
    </section>
  );
}

type StepCropProps = {
  source: string;
  onConfirm: (croppedDataUrl: string) => Promise<void>;
  onBack: () => void;
};

function StepCrop({ source, onConfirm, onBack }: StepCropProps) {
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onCropComplete = useCallback((_crop: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = new Image();
    image.src = source;
    await image.decode();
    if (!canvas || !ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    const data = canvas.toDataURL('image/jpeg', 0.92);
    await onConfirm(data);
  }, [croppedAreaPixels, onConfirm, source]);

  return (
    <section className="screen">
      <div className="screen-content cropper">
        <div ref={containerRef} className="cropper-container">
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
        <p className="helper-text">Pinch or use the slider to frame your room.</p>
        <div className="button-stack">
          <button className="btn btn-tertiary" onClick={onBack}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Continue
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} hidden />
    </section>
  );
}

type StepPlacementProps = {
  background: string;
  productImage: string;
  placement: Placement;
  onPlacementChange: (p: Placement) => void;
  onGeneratePreview: () => void;
  onBack: () => void;
};

function StepPlacement({
  background,
  productImage,
  placement,
  onPlacementChange,
  onGeneratePreview,
  onBack
}: StepPlacementProps) {
  const [showGuides, setShowGuides] = useState(false);

  const handleToggleGuides = useCallback(() => {
    setShowGuides((prev) => {
      const next = !prev;
      analytics.track('guides_toggle', { enabled: next });
      return next;
    });
  }, []);

  return (
    <section className="screen placement">
      <div className="instruction-banner" role="status" aria-live="polite">
        Pinch to resize, drag to move, and two fingers to rotate.
      </div>
      <div className="placement-toolbar">
        <button
          className={`btn btn-ghost${showGuides ? ' is-active' : ''}`}
          type="button"
          onClick={handleToggleGuides}
        >
          {showGuides ? 'Hide Guides' : 'Show Guides'}
        </button>
      </div>
      <PlacementCanvas
        background={background}
        productImage={productImage}
        placement={placement}
        onChange={onPlacementChange}
        showGuides={showGuides}
      />
      <div className="placement-actions">
        <button className="btn btn-tertiary" onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={onGeneratePreview}>
          See how it looks
        </button>
      </div>
    </section>
  );
}

type PlacementCanvasProps = {
  background: string;
  productImage: string;
  placement: Placement;
  onChange: (p: Placement) => void;
  showGuides?: boolean;
};

function PlacementCanvas({ background, productImage, placement, onChange, showGuides = false }: PlacementCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initial = useRef<{
    placement: Placement;
    distance?: number;
    angle?: number;
    singleStart?: { x: number; y: number };
  }>({ placement });

  const updatePlacement = useCallback(
    (partial: Partial<Placement>) => {
      onChange({
        ...placement,
        ...partial
      });
    },
    [onChange, placement]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      initial.current = {
        placement,
        singleStart: { x: event.clientX, y: event.clientY }
      };
    }
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      initial.current = { placement, distance, angle };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const values = Array.from(pointers.current.values());

    if (values.length === 1) {
      const start = initial.current.singleStart ?? values[0];
      const deltaX = values[0].x - start.x;
      const deltaY = values[0].y - start.y;

      updatePlacement({
        x: initial.current.placement.x + deltaX,
        y: initial.current.placement.y + deltaY
      });
      return;
    }

    if (values.length === 2 && initial.current.distance && initial.current.angle !== undefined) {
      const [a, b] = values;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const scaleDelta = distance / initial.current.distance;
      const rotationDelta = ((angle - initial.current.angle) * 180) / Math.PI;
      updatePlacement({
        scale: clamp(initial.current.placement.scale * scaleDelta, 0.3, 3),
        rotation: initial.current.placement.rotation + rotationDelta
      });
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    initial.current = { placement };
  };

  const transformStyle = useMemo(() => {
    return {
      transform: `translate(${placement.x}px, ${placement.y}px) scale(${placement.scale}) rotate(${placement.rotation}deg)`
    };
  }, [placement]);

  return (
    <div
      ref={containerRef}
      className={`placement-canvas${showGuides ? ' show-guides' : ''}`}
      style={{ backgroundImage: `url(${background})` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="product-handle" style={transformStyle}>
        <img src={productImage} alt="Selected product" draggable={false} />
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function StepLoading() {
  return (
    <section className="screen loading" aria-live="polite" aria-busy="true">
      <div className="spinner" />
      <p>Creating your preview...</p>
    </section>
  );
}

type StepPreviewProps = {
  previewUrl: string;
  productTitle: string;
  onAdjust: () => void;
  onBackToStore: () => void;
  errorMessage?: string | null;
  history: string[];
  onSelectHistory: (url: string) => void;
};

function StepPreview({ previewUrl, productTitle, onAdjust, onBackToStore, errorMessage, history, onSelectHistory }: StepPreviewProps) {
  return (
    <section className="screen preview">
      <div className="preview-image-wrapper">
        <img src={previewUrl} alt={`${productTitle} in your space`} />
      </div>
      {errorMessage && (
        <p className="error-banner" role="alert">
          {errorMessage}
        </p>
      )}
      {history.length > 1 && (
        <div className="preview-gallery">
          {history.map((url) => (
            <button
              key={url}
              type="button"
              className={`preview-thumb${url === previewUrl ? ' is-active' : ''}`}
              onClick={() => onSelectHistory(url)}
            >
              <img src={url} alt="Preview option" />
            </button>
          ))}
        </div>
      )}
      <div className="button-stack">
        <button className="btn btn-secondary" onClick={onAdjust}>
          Adjust
        </button>
        <button className="btn btn-primary" onClick={onBackToStore}>
          Back to Store
        </button>
      </div>
    </section>
  );
}

type EmailModalProps = {
  sessionId: string | null;
  onClose: () => void;
};

function EmailModal({ sessionId, onClose }: EmailModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setEmail('');
    setConsent(false);
    setStatus('idle');
    setError(null);
  }, [sessionId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId) {
      onClose();
      return;
    }
    if (!consent) {
      setError('Please confirm we can send your previews to this email.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await sendSessionEmail({ sessionId, email });
      analytics.track('email_sent', { sessionId, status: 'success' });
      setStatus('sent');
      setTimeout(onClose, 900);
    } catch (err) {
      console.warn(err);
      setError('We could not send your photos right now. Please try again.');
      setStatus('error');
      analytics.track('email_sent', { sessionId, status: 'error' });
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="email-modal" role="dialog" aria-modal="true" aria-labelledby="emailModalTitle">
        <button className="modal-close" onClick={onClose} aria-label="Close email dialog">
          ×
        </button>
        <h2 id="emailModalTitle">Get your photos?</h2>
        <p>Enter your email to receive everything you created in this session.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === 'error') {
                setStatus('idle');
                setError(null);
              }
            }}
          />
          <label className="consent-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                if (status === 'error') {
                  setStatus('idle');
                  setError(null);
                }
              }}
              required
            />
            <span>Yes, send my previews to this email address.</span>
          </label>
          {error && (
            <span className="error-text" role="alert">
              {error}
            </span>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={status === 'sending' || email.length === 0 || !consent}
          >
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent!' : 'Send Photos'}
          </button>
        </form>
        <button className="btn btn-tertiary" onClick={onClose}>
          No thanks
        </button>
      </div>
    </div>
  );
}

type TopBarProps = {
  productTitle: string;
  onClose: () => void;
};

function TopBar({ productTitle, onClose }: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="icon-button" onClick={onClose} aria-label="Close preview">
        ×
      </button>
      <span className="product-name">{productTitle}</span>
      <button className="icon-button" aria-label="Share preview">
        ☰
      </button>
    </header>
  );
}
