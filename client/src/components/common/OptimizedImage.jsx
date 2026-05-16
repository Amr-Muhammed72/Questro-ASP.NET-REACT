import { memo, useMemo, useState } from 'react';

const DEFAULT_WIDTHS = [160, 240, 320, 480, 640];
const TMDB_WIDTHS = [185, 342, 500, 780];

const buildUrlWithParams = (src, params) => {
  if (!src) return null;
  try {
    const url = new URL(src, window.location.origin);
    const { w, q, format } = params;

    if (format && !url.searchParams.has('format')) {
      url.searchParams.set('format', format);
    }
    if (q && !url.searchParams.has('q')) {
      url.searchParams.set('q', String(q));
    }
    if (w && !url.searchParams.has('w')) {
      url.searchParams.set('w', String(w));
    }

    return url.toString();
  } catch {
    return src;
  }
};

const isTmdbUrl = (src) => src?.includes('image.tmdb.org/t/p/');

const buildTmdbUrl = (src, width) => {
  if (!src) return null;
  const size = `w${width}`;
  return src.replace(/\/t\/p\/[^/]+/i, `/t/p/${size}`);
};

const buildSrcSet = (src, widths, format) => {
  if (!src) return undefined;

  if (isTmdbUrl(src)) {
    return TMDB_WIDTHS
      .map((width) => `${buildTmdbUrl(src, width)} ${width}w`)
      .join(', ');
  }

  return widths
    .map((width) => `${buildUrlWithParams(src, { w: width, q: 75, format })} ${width}w`)
    .join(', ');
};

const OptimizedImage = memo(({
  src,
  alt,
  className,
  imgClassName = 'w-full h-full object-cover',
  sizes = '(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 10rem',
  priority = false,
}) => {
  
  const [isLoaded, setIsLoaded] = useState(false);

  const placeholderSrc = useMemo(
    () => buildUrlWithParams(src, { w: 32, q: 30, format: 'webp' }),
    [src]
  );
  const webpSrcSet = useMemo(
    () => buildSrcSet(src, DEFAULT_WIDTHS, 'webp'),
    [src]
  );
  const avifSrcSet = useMemo(
    () => buildSrcSet(src, DEFAULT_WIDTHS, 'avif'),
    [src]
  );
  const fallbackSrcSet = useMemo(
    () => buildSrcSet(src, DEFAULT_WIDTHS),
    [src]
  );

  if (!src) return null;

  return (
    <div className={className}>
      {placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={`${imgClassName} blur-md scale-105 transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      <picture>
        {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
        <img
          src={src}
          srcSet={fallbackSrcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          className={`${imgClassName} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </picture>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';
export default OptimizedImage;