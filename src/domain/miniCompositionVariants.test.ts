import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageShim } from '../test/localStorageShim';
import {
  DEFAULT_MINI_COMPOSITION_VARIANT_ID,
  resolveMiniCompositionVariantId,
} from './miniCompositionVariants';
import {
  resolveConfiguredMiniVariantId,
} from './miniVariantPreference';
import {
  readPersistedMiniVariantRaw,
} from '../services/miniVariantPreferenceStore';

const storageShim = createLocalStorageShim();

afterEach(() => {
  storageShim.reset();
  vi.resetModules();
});

storageShim.install();

describe('miniCompositionVariants selection', () => {
  it('defaults mini mode to three-row when no preference is set', () => {
    expect(DEFAULT_MINI_COMPOSITION_VARIANT_ID).toBe('mini-three-row');
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row');
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-three-row');
    expect(resolveMiniCompositionVariantId('large-sel', 'mini-shelf-emphasis')).toBe('mini-three-row');
  });

  it('uses persisted mini variant when available', () => {
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis');

    expect(readPersistedMiniVariantRaw()).toBe('mini-shelf-emphasis');
    expect(resolveConfiguredMiniVariantId()).toBe('mini-shelf-emphasis');
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-shelf-emphasis');
  });

  it('falls back to three-row when persisted mini variant is invalid', () => {
    window.localStorage.setItem('miniVariant', 'not-a-variant');

    expect(readPersistedMiniVariantRaw()).toBe('not-a-variant');
    expect(resolveConfiguredMiniVariantId()).toBe('mini-three-row');
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-three-row');
  });

  it('resolves mini mode dynamically from latest persisted variant', () => {
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis');
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-shelf-emphasis');

    window.localStorage.setItem('miniVariant', 'mini-three-row');
    expect(resolveMiniCompositionVariantId('mini-sel', resolveConfiguredMiniVariantId())).toBe('mini-three-row');
  });
});
