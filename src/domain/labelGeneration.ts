import {
  VALIDATION_MESSAGES,
  getAisleRangeValidationMessage,
  getShortBayRangeValidationMessage,
  getSideBayRangeValidationMessage,
} from '../config/validationMessages';
import { AISLE_SIDES } from '../config/labelConfig';
import { AisleSide } from '../models/IAisleCodeParts';
import { hasValue } from './numericGuard';

export interface IAisleLabelInput {
  aisle_start: number | null;
  aisle_end: number | null;
  lf_start: number | null;
  lf_end: number | null;
  ef_start: number | null;
  ef_end: number | null;
  rf_start: number | null;
  rf_end: number | null;
  ft_start: number | null;
  ft_end: number | null;
  shelf_start: string | null;
  shelf_end: string | null;
}

export interface IShortLabelInput {
  bay_start: number | null;
  bay_end: number | null;
  shelf_start: string | null;
  shelf_end: string | null;
  prefix: string;
}

interface IAisleValidationLimits {
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
}

type SideRangeInputKeys = {
  start: keyof IAisleLabelInput;
  end: keyof IAisleLabelInput;
};

const SIDE_RANGE_INPUT_KEYS: Record<AisleSide, SideRangeInputKeys> = {
  L: { start: 'lf_start', end: 'lf_end' },
  R: { start: 'rf_start', end: 'rf_end' },
  E: { start: 'ef_start', end: 'ef_end' },
  F: { start: 'ft_start', end: 'ft_end' },
};

const getAisleSideRanges = (
  input: IAisleLabelInput,
): Array<{ side: AisleSide; start: number | null; end: number | null }> => {
  return AISLE_SIDES.map((side) => {
    const keys = SIDE_RANGE_INPUT_KEYS[side];
    return {
      side,
      start: input[keys.start] as number | null,
      end: input[keys.end] as number | null,
    };
  });
};

const getShelfTokens = (startShelf: string, endShelf: string): string[] => {
  const startCode = startShelf.charCodeAt(0);
  const endCode = endShelf.charCodeAt(0);
  return Array.from({ length: endCode - startCode + 1 }, (_, index) => String.fromCharCode(startCode + index));
};

export const getShelfRangeCount = (shelfStart: string | null, shelfEnd: string | null): number => {
  if (!shelfEnd) {
    return 0;
  }

  const start = shelfStart ?? 'A';
  return shelfEnd.charCodeAt(0) - start.charCodeAt(0) + 1;
};

const buildAisleSideCodes = (
  aisle: number,
  side: AisleSide,
  start: number,
  end: number,
  shelfTokens: string[],
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  const barcodes: string[] = [];
  const aisleText = formatTwoDigitValue(aisle);

  for (let bay = start; bay <= end; bay += 1) {
    const bayText = formatTwoDigitValue(bay);
    for (const shelfToken of shelfTokens) {
      barcodes.push(`${aisleText}${side}${bayText}${shelfToken}`);
    }
  }

  return barcodes;
};

export const parseNumericInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '' || !/^\d+$/.test(trimmed)) {
    return null;
  }

  return Number(trimmed);
};

export const validateAisleLabelInput = (
  input: IAisleLabelInput,
  limits: IAisleValidationLimits,
): string | null => {
  const { minAisleValue, maxAisleValue, maxBayValue } = limits;

  if (!hasValue(input.aisle_start) || !hasValue(input.aisle_end) || !input.shelf_end) {
    return VALIDATION_MESSAGES.aisleRequired;
  }

  if (
    input.aisle_start < minAisleValue ||
    input.aisle_end < minAisleValue ||
    input.aisle_end > maxAisleValue
  ) {
    return getAisleRangeValidationMessage(minAisleValue, maxAisleValue);
  }

  if (input.aisle_start > input.aisle_end) {
    return VALIDATION_MESSAGES.aisleOrder;
  }

  if (input.shelf_start && input.shelf_start > input.shelf_end) {
    return VALIDATION_MESSAGES.shelfOrder;
  }

  const sideRanges = getAisleSideRanges(input).map((range) => [range.start, range.end] as const);
  const hasIncompleteRange = sideRanges.some(([start, end]) => hasValue(start) !== hasValue(end));
  if (hasIncompleteRange) {
    return VALIDATION_MESSAGES.sideRangeIncomplete;
  }

  const completeRanges = sideRanges.filter(([start, end]) => hasValue(start) && hasValue(end));
  if (completeRanges.length === 0) {
    return VALIDATION_MESSAGES.sideRangeRequired;
  }

  for (const [start, end] of sideRanges) {
    if (hasValue(start) && hasValue(end) && start > end) {
      return VALIDATION_MESSAGES.sideRangeOrder;
    }

    if (hasValue(start) && hasValue(end) && (start < 1 || end < 1 || end > maxBayValue)) {
      return getSideBayRangeValidationMessage(1, maxBayValue);
    }
  }

  return null;
};

export const generateAisleLabelCodes = (
  input: IAisleLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasValue(input.aisle_start) || !hasValue(input.aisle_end) || !input.shelf_end) {
    return [];
  }

  const shelfTokens = getShelfTokens(input.shelf_start ?? 'A', input.shelf_end);
  const labelsBySide = Object.fromEntries(
    AISLE_SIDES.map((side) => [side, [] as string[]]),
  ) as Record<AisleSide, string[]>;
  const selectedSideCandidates = getAisleSideRanges(input);
  const selectedSides: Array<{ side: AisleSide; start: number; end: number }> =
    selectedSideCandidates
      .filter((range): range is { side: AisleSide; start: number; end: number } => {
        return hasValue(range.start) && hasValue(range.end);
      });

  for (let aisle = input.aisle_start; aisle <= input.aisle_end; aisle += 1) {
    for (const sideRange of selectedSides) {
      labelsBySide[sideRange.side].push(
        ...buildAisleSideCodes(
          aisle,
          sideRange.side,
          sideRange.start,
          sideRange.end,
          shelfTokens,
          formatTwoDigitValue,
        ),
      );
    }
  }

  return AISLE_SIDES.flatMap((side) => labelsBySide[side]);
};

export const validateShortLabelInput = (
  input: IShortLabelInput,
  minBayValue: number,
  maxBayValue: number,
): string | null => {
  if (!hasValue(input.bay_start) || !hasValue(input.bay_end) || !input.shelf_end) {
    return VALIDATION_MESSAGES.shortRequired;
  }

  if (input.bay_start > input.bay_end) {
    return VALIDATION_MESSAGES.shortOrder;
  }

  if (input.shelf_start && input.shelf_start > input.shelf_end) {
    return VALIDATION_MESSAGES.shelfOrder;
  }

  if (input.bay_start < minBayValue || input.bay_end < minBayValue || input.bay_end > maxBayValue) {
    return getShortBayRangeValidationMessage(minBayValue, maxBayValue);
  }

  return null;
};

export const generateShortLabelCodes = (
  input: IShortLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasValue(input.bay_start) || !hasValue(input.bay_end) || !input.shelf_end) {
    return [];
  }

  const shelfTokens = getShelfTokens(input.shelf_start ?? 'A', input.shelf_end);
  const labels: string[] = [];

  for (let bay = input.bay_start; bay <= input.bay_end; bay += 1) {
    const bayText = formatTwoDigitValue(bay);
    for (const shelfToken of shelfTokens) {
      labels.push(`${input.prefix}${bayText}${shelfToken}`);
    }
  }

  return labels;
};

export const normalizeSpecificInputCodes = (rawInput: string): string[] => {
  return rawInput
    .split(',')
    .map((text) => text.trim().toUpperCase())
    .filter((text) => text.length > 0);
};
