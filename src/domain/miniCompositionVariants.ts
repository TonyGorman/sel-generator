import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { IMiniCompositionVariant, MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { miniShelfEmphasisVariant } from './variants/miniShelfEmphasisVariant';
import { miniThreeRowVariant } from './variants/miniThreeRowVariant';

export const DEFAULT_MINI_COMPOSITION_VARIANT_ID: MiniCompositionVariantId = 'mini-three-row';

const variantRegistry = new Map<MiniCompositionVariantId, IMiniCompositionVariant>([
  [DEFAULT_MINI_COMPOSITION_VARIANT_ID, miniThreeRowVariant],
  ['mini-shelf-emphasis', miniShelfEmphasisVariant],
]);

export const MINI_VARIANT_OPTIONS: ReadonlyArray<{ id: MiniCompositionVariantId; label: string }> =
  Array.from(variantRegistry.values()).map((v) => ({ id: v.id, label: v.displayLabel }));

export const isMiniCompositionVariantId = (value: unknown): value is MiniCompositionVariantId => {
  return typeof value === 'string' && variantRegistry.has(value as MiniCompositionVariantId);
};

export const getMiniCompositionVariant = (id: MiniCompositionVariantId): IMiniCompositionVariant => {
  return variantRegistry.get(id) ?? miniThreeRowVariant;
};

export const resolveMiniCompositionVariantId = (
  mode: LabelPrintMode,
  configuredMiniVariantId: MiniCompositionVariantId = DEFAULT_MINI_COMPOSITION_VARIANT_ID,
): MiniCompositionVariantId => {
  if (mode === 'mini-sel') {
    return configuredMiniVariantId;
  }

  return DEFAULT_MINI_COMPOSITION_VARIANT_ID;
};
