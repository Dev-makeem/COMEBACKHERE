import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';

export function useLazyTab(Component: React.ComponentType): ReactNode {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  return Suspense;
}
