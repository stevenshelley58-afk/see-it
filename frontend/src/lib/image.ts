export async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export async function getCroppedImage(dataUrl: string, crop: { x: number; y: number; width: number; height: number }) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function downscaleImage(dataUrl: string, maxSize = 1024) {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function dataUrlToFile(dataUrl: string, filename: string) {
  const [metadata, content] = dataUrl.split(',');
  const mime = metadata.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg';
  const buffer = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
  return new File([buffer], filename, { type: mime });
}

