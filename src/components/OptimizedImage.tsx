import { useState, ImgHTMLAttributes } from 'react';
import { transformImage, TransformOptions } from '../utils/transformImage';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  transform?: TransformOptions;
}

export default function OptimizedImage({ src, transform, ...rest }: OptimizedImageProps) {
  const [useFallback, setUseFallback] = useState(false);

  const displaySrc = !useFallback && transform
    ? transformImage(src, transform)
    : src;

  if (!displaySrc) return null;

  return (
    <img
      {...rest}
      src={displaySrc}
      onError={(e) => {
        if (!useFallback && transform) {
          setUseFallback(true);
        }
        rest.onError?.(e);
      }}
    />
  );
}
