import React, { Suspense, useEffect, useRef, useState } from 'react';
import { ChunkSectionFallback } from './ChunkFallback';

export interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
  minHeight?: number;
  rootMargin?: string;
  forceMount?: boolean;
  className?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  label = 'Loading section...',
  minHeight = 200,
  rootMargin = '280px 0px',
  forceMount = false,
  className = '',
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState<boolean>(() => Boolean(forceMount));

  useEffect(() => {
    if (forceMount && !hydrated) {
      setHydrated(true);
    }
  }, [forceMount, hydrated]);

  useEffect(() => {
    if (hydrated) return;
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHydrated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHydrated(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hydrated, rootMargin]);

  const placeholder = fallback ?? (
    <ChunkSectionFallback label={label} minHeight={minHeight} />
  );

  return (
    <div
      ref={hostRef}
      className={className}
      style={!hydrated ? { minHeight } : undefined}
    >
      {hydrated ? (
        <Suspense fallback={placeholder}>{children}</Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
};

LazySection.displayName = 'LazySection';

