import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { reportMiniVariantStorageIssue } from '../telemetry/miniVariantStorageTelemetry';

export const MINI_VARIANT_STORAGE_KEY = 'miniVariant';

export const readPersistedMiniVariantRaw = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const persistedVariant = window.localStorage.getItem(MINI_VARIANT_STORAGE_KEY);
    return persistedVariant;
  } catch (error) {
    reportMiniVariantStorageIssue('read', error, MINI_VARIANT_STORAGE_KEY);
    return null;
  }
};

export const writePersistedMiniVariant = (variantId: MiniCompositionVariantId): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(MINI_VARIANT_STORAGE_KEY, variantId);
  } catch (error) {
    reportMiniVariantStorageIssue('write', error, MINI_VARIANT_STORAGE_KEY);
    // Ignore storage write failures so label generation remains functional in restricted environments.
  }
};

export const clearPersistedMiniVariant = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(MINI_VARIANT_STORAGE_KEY);
  } catch (error) {
    reportMiniVariantStorageIssue('clear', error, MINI_VARIANT_STORAGE_KEY);
  }
};
