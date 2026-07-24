export const VALIDATION_MESSAGES = {
  specificEmpty: 'Enter at least one label value.',
  aisleRequired: 'Please enter aisle start, aisle end, and select a shelf.',
  aisleOrder: 'Aisle start cannot be greater than aisle end.',
  sideRangeRequired: 'Enter at least one complete side range (both start and end bays).',
  sideRangeIncomplete: 'Enter both start and end bay values for each selected side.',
  sideRangeOrder: 'Side range start cannot be greater than side range end.',
  shortRequired: 'Please enter start bay, end bay, and select an end shelf.',
  shortOrder: 'Start bay cannot be greater than end bay.',
  shelfOrder: 'Start shelf must come before or equal to end shelf.',
  specificLargeSelSpecialCode: 'Special label values (such as KIOSK) are not supported on large labels. Switch to mini labels or remove the special values.',
} as const;

/**
 * Typed error codes returned by domain validation functions in `labelGeneration.ts`.
 * Keeping these as codes (rather than message strings) at the domain boundary lets the
 * UI layer own text mapping/formatting (and future i18n) via `getValidationErrorMessage`.
 */
export type LabelValidationErrorCode =
  | { code: 'AISLE_REQUIRED' }
  | { code: 'AISLE_RANGE'; minAisleValue: number; maxAisleValue: number }
  | { code: 'AISLE_ORDER' }
  | { code: 'SHELF_ORDER' }
  | { code: 'SIDE_RANGE_INCOMPLETE' }
  | { code: 'SIDE_RANGE_REQUIRED' }
  | { code: 'SIDE_RANGE_ORDER' }
  | { code: 'SIDE_BAY_RANGE'; minBayValue: number; maxBayValue: number }
  | { code: 'SHORT_REQUIRED' }
  | { code: 'SHORT_ORDER' }
  | { code: 'SHORT_BAY_RANGE'; minBayValue: number; maxBayValue: number };

export const getValidationErrorMessage = (error: LabelValidationErrorCode): string => {
  switch (error.code) {
    case 'AISLE_REQUIRED':
      return VALIDATION_MESSAGES.aisleRequired;
    case 'AISLE_RANGE':
      return getAisleRangeValidationMessage(error.minAisleValue, error.maxAisleValue);
    case 'AISLE_ORDER':
      return VALIDATION_MESSAGES.aisleOrder;
    case 'SHELF_ORDER':
      return VALIDATION_MESSAGES.shelfOrder;
    case 'SIDE_RANGE_INCOMPLETE':
      return VALIDATION_MESSAGES.sideRangeIncomplete;
    case 'SIDE_RANGE_REQUIRED':
      return VALIDATION_MESSAGES.sideRangeRequired;
    case 'SIDE_RANGE_ORDER':
      return VALIDATION_MESSAGES.sideRangeOrder;
    case 'SIDE_BAY_RANGE':
      return getSideBayRangeValidationMessage(error.minBayValue, error.maxBayValue);
    case 'SHORT_REQUIRED':
      return VALIDATION_MESSAGES.shortRequired;
    case 'SHORT_ORDER':
      return VALIDATION_MESSAGES.shortOrder;
    case 'SHORT_BAY_RANGE':
      return getShortBayRangeValidationMessage(error.minBayValue, error.maxBayValue);
    default: {
      const exhaustiveCheck: never = error;
      return exhaustiveCheck;
    }
  }
};

export const getAisleRangeValidationMessage = (minAisleValue: number, maxAisleValue: number): string => {
  return `Aisles must be between ${minAisleValue} and ${maxAisleValue}.`;
};

export const getShortBayRangeValidationMessage = (minBayValue: number, maxBayValue: number): string => {
  return `Bays must be between ${minBayValue} and ${maxBayValue}.`;
};

export const getSideBayRangeValidationMessage = (minBayValue: number, maxBayValue: number): string => {
  return `Bay values must be between ${minBayValue} and ${maxBayValue}.`;
};

export const getLabelHardLimitMessage = (hardLimit: number): string => {
  return `Too many labels requested. Reduce the total to ${hardLimit} or fewer.`;
};

export const getLabelSoftLimitMessage = (softLimit: number): string => {
  return `Large batch warning: more than ${softLimit} labels may slow preview or print.`;
};

interface ISpecificInvalidLabelMessageArgs {
  aislePrefixedExamples: string;
  backPrefix: string;
  frontPrefix: string;
  namedAisleExamples: string;
  bayRangeText: string;
  shelfRangeText: string;
}

export const getSpecificInvalidLabelMessage = ({
  aislePrefixedExamples,
  backPrefix,
  frontPrefix,
  namedAisleExamples,
  bayRangeText,
  shelfRangeText,
}: ISpecificInvalidLabelMessageArgs): string => {
  return `Use valid label codes only. Supported formats: 01L01A, ${aislePrefixedExamples}, ${backPrefix}01A, ${frontPrefix}01A, or named aisle values (${namedAisleExamples}) with no bay or shelf. Bay must be ${bayRangeText} and shelf must be ${shelfRangeText}`;
};
