import { afterEach, describe, expect, it, vi } from 'vitest';

const setQuery = (query: string): void => {
  const suffix = query ? `?${query}` : '';
  window.history.replaceState({}, '', `/${suffix}`);
};

const importFresh = async () => {
  vi.resetModules();
  return import('./miniCompositionVariants');
};

afterEach(() => {
  setQuery('');
  vi.resetModules();
});

describe('miniCompositionVariants query override', () => {
  it('defaults mini mode to three-row when querystring is not provided', async () => {
    setQuery('');
    const module = await importFresh();

    expect(module.DEFAULT_MINI_COMPOSITION_VARIANT_ID).toBe('mini-three-row');
    expect(module.resolveMiniCompositionVariantId('mini-sel')).toBe('mini-three-row');
    expect(module.resolveMiniCompositionVariantId('large-sel')).toBe('mini-three-row');
  });

  it('uses shelf-emphasis when querystring override is valid', async () => {
    setQuery('miniVariant=mini-shelf-emphasis');
    const module = await importFresh();

    expect(module.DEFAULT_MINI_COMPOSITION_VARIANT_ID).toBe('mini-shelf-emphasis');
    expect(module.resolveMiniCompositionVariantId('mini-sel')).toBe('mini-shelf-emphasis');
  });

  it('falls back to three-row when querystring override is invalid', async () => {
    setQuery('miniVariant=not-a-variant');
    const module = await importFresh();

    expect(module.DEFAULT_MINI_COMPOSITION_VARIANT_ID).toBe('mini-three-row');
    expect(module.resolveMiniCompositionVariantId('mini-sel')).toBe('mini-three-row');
  });
});
