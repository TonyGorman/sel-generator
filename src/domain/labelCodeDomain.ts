// Parser exports
export type { ParsedLabelCode } from './labelCodeParser';
export { parseLabelCode } from './labelCodeParser';

// Validator exports
export type {
  SpecificLabelValidationErrorReason,
  SpecificLabelValidationResult,
  ISpecificLabelValidationOptions,
} from './labelCodeValidator';
export { validateSpecificLabelCode } from './labelCodeValidator';

// Display exports
export type { CompactLabelCode, ILargeLabelDisplayParts, IMiniThreeRowDisplayParts } from './labelCodeDisplay';
export {
  normalizeLabelCode,
  getEncodedLabelCode,
  getLargeSelDisplayParts,
  getMiniThreeRowDisplayParts,
} from './labelCodeDisplay';

export type {
  MiniCompositionVariantId,
  IComposedMiniLabel,
  IMiniVariantGeometry,
  IMiniTypographyFitResult,
  IMiniCompositionVariant,
  MiniTextMeasureFn,
} from '../models/IMiniCompositionVariant';
export {
  DEFAULT_MINI_COMPOSITION_VARIANT_ID,
  getMiniCompositionVariant,
  resolveMiniCompositionVariantId,
} from './miniCompositionVariants';
