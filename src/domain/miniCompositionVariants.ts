import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { IMiniCompositionVariant, MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { miniShelfEmphasisVariant } from './variants/miniShelfEmphasisVariant';
import { miniThreeRowVariant } from './variants/miniThreeRowVariant';

const variantRegistry = new Map<MiniCompositionVariantId, IMiniCompositionVariant>([
  ['mini-three-row', miniThreeRowVariant],
  ['mini-shelf-emphasis', miniShelfEmphasisVariant],
]);

const isMiniCompositionVariantId = (value: unknown): value is MiniCompositionVariantId => {
  return value === 'mini-three-row' || value === 'mini-shelf-emphasis';
};

const resolveQuerystringMiniVariant = (): MiniCompositionVariantId | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const queryVariant = new URLSearchParams(window.location.search).get('miniVariant');
  if (!isMiniCompositionVariantId(queryVariant)) {
    return null;
  }

  return queryVariant;
};

const resolveConfiguredMiniVariant = (): MiniCompositionVariantId => {
  const queryVariant = resolveQuerystringMiniVariant();
  if (queryVariant) {
    return queryVariant;
  }

  return 'mini-three-row';
};

export const getMiniCompositionVariant = (id: MiniCompositionVariantId): IMiniCompositionVariant => {
  return variantRegistry.get(id) ?? miniThreeRowVariant;
};

export const DEFAULT_MINI_COMPOSITION_VARIANT_ID: MiniCompositionVariantId = resolveConfiguredMiniVariant();

export const resolveMiniCompositionVariantId = (mode: LabelPrintMode): MiniCompositionVariantId => {
  if (mode === 'mini-sel') {
    return DEFAULT_MINI_COMPOSITION_VARIANT_ID;
  }

  return 'mini-three-row';
};
