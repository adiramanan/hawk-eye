/**
 * Hawk-Eye Store Context
 *
 * React Context for providing the store to components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { HawkEyeStore } from './types';
import {
  createHawkEyeStore,
  getGlobalStore,
  setGlobalStore,
} from './index';
import {
  createStoreWithMiddleware,
  previewMiddleware,
  validationMiddleware,
  loggerMiddleware,
} from './middleware';

/**
 * Store context
 */
const StoreContext = createContext<HawkEyeStore | null>(null);

/**
 * Provider component
 */
export interface HawkEyeProviderProps {
  children: ReactNode;
  store?: HawkEyeStore;
  enableLogging?: boolean;
}

export function HawkEyeProvider({
  children,
  store: providedStore,
  enableLogging = false,
}: HawkEyeProviderProps) {
  // Use provided store or create new one
  const store = React.useMemo(() => {
    const baseStore = providedStore || createHawkEyeStore();

    // Apply middleware
    const middlewares = [previewMiddleware, validationMiddleware];
    if (enableLogging) {
      middlewares.push(loggerMiddleware);
    }

    const storeWithMiddleware = createStoreWithMiddleware(baseStore, ...middlewares);

    // Set as global store for hooks to use
    setGlobalStore(storeWithMiddleware);

    return storeWithMiddleware;
  }, [providedStore, enableLogging]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * Hook to get store from context
 */
export function useStore(): HawkEyeStore {
  const store = useContext(StoreContext);
  if (!store) {
    // Fallback to global store for backward compatibility
    return getGlobalStore();
  }
  return store;
}
