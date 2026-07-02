import { DEFAULT_MINI_COMPOSITION_VARIANT_ID, isMiniCompositionVariantId } from './miniCompositionVariants';
import { readPersistedMiniVariantRaw } from '../services/miniVariantPreferenceStore';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';

export const resolveConfiguredMiniVariantId = (): MiniCompositionVariantId => {
  const persistedVariant = readPersistedMiniVariantRaw();

  if (isMiniCompositionVariantId(persistedVariant)) {
    return persistedVariant;
  }

  return DEFAULT_MINI_COMPOSITION_VARIANT_ID;
};