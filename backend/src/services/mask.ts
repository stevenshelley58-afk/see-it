import sharp from 'sharp';
import { PNG } from 'pngjs';

type Placement = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export async function generatePlacementMask(imageBuffer: Buffer, placement: Placement) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;

  const centerX = width / 2 + placement.x;
  const centerY = height / 2 + placement.y;
  const baseRadius = Math.min(width, height) / 3;
  const radiusX = baseRadius * placement.scale;
  const radiusY = radiusX;
  const rotationRadians = (placement.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRadians);
  const sin = Math.sin(rotationRadians);

  const png = new PNG({ width, height });
  const data = png.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (width * y + x) << 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const rotatedX = dx * cos + dy * sin;
      const rotatedY = -dx * sin + dy * cos;
      const value = rotatedX * rotatedX / (radiusX * radiusX) + rotatedY * rotatedY / (radiusY * radiusY);
      const alpha = value <= 1 ? 255 : 0;

      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = alpha;
    }
  }

  return PNG.sync.write(png);
}

