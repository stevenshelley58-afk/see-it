declare module 'react-easy-crop' {
  import type { ComponentType } from 'react';

  export type Area = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  export type Crop = {
    x: number;
    y: number;
  };

  export interface CropperProps {
    image: string;
    crop: Crop;
    zoom: number;
    aspect?: number;
    restrictPosition?: boolean;
    onCropChange?: (value: Crop) => void;
    onZoomChange?: (value: number) => void;
    onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
  }

  const Cropper: ComponentType<CropperProps>;
  export default Cropper;
}

