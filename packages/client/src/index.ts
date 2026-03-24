// Export main component
export { DesignTool } from './DesignTool';

// Export types
export type { DesignToolProps } from './DesignTool';

// Export store (Pillar 2: Centralized State Management)
export {
  createHawkEyeStore,
  getGlobalStore,
  setGlobalStore,
  resetGlobalStore,
  hawkEyeReducer,
  initialState,
} from './store';

export type { HawkEyeState, HawkEyeStore, StoreAction, StoreListener } from './store';

// Export store hooks
export { useHawkEyeState, useHawkEyeSelector, useHawkEyeDispatch, useHawkEyeReducer } from './store/hooks';

// Export store provider
export { HawkEyeProvider } from './store/context';
export type { HawkEyeProviderProps } from './store/context';

// Export schema & validation (Pillar 3: Type Safety)
export {
  propertySchemaRegistry,
  initializeDefaultSchemas,
  validators,
  type ValidationResult,
  type PropertySchema,
} from './schema/property-schema';

export {
  tokenValidator,
  getToken,
  type ColorToken,
  type SpacingToken,
  type ShadowToken,
  type RadiusToken,
  type DesignToken,
} from './schema/token-validators';
