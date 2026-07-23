import {
  VALIDATION_MESSAGES,
  getAisleRangeValidationMessage,
  getShortBayRangeValidationMessage,
  getSideBayRangeValidationMessage,
} from '../config/validationMessages';
import { AISLE_SIDES } from '../config/labelConfig';
import { AisleSide } from '../models/IAisleCodeParts';
import { hasValue } from './numericGuard';

export interface IAisleSideRange {
  start: number | null;
  end: number | null;
}

export type IAisleSideRanges = Record<AisleSide, IAisleSideRange>;

export const createEmptyAisleSideRanges = (): IAisleSideRanges => {
  return Object.fromEntries(
    AISLE_SIDES.map((side) => [side, { start: null, end: null }]),
  ) as IAisleSideRanges;
};

export interface IAisleLabelInput {
  aisleStart: number | null;
  aisleEnd: number | null;
  sideRanges: IAisleSideRanges;
  shelfStart: string | null;
  shelfEnd: string | null;
}

export interface IShortLabelInput {
  bayStart: number | null;
  bayEnd: number | null;
  shelfStart: string | null;
  shelfEnd: string | null;
  prefix: string;
}

interface IAisleValidationLimits {
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
}

const getAisleSideRanges = (
  input: IAisleLabelInput,
): Array<{ side: AisleSide; start: number | null; end: number | null }> => {
  return AISLE_SIDES.map((side) => ({
    side,
    start: input.sideRanges[side].start,
    end: input.sideRanges[side].end,
  }));
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

  if (!hasValue(input.aisleStart) || !hasValue(input.aisleEnd) || !input.shelfEnd) {
    return VALIDATION_MESSAGES.aisleRequired;
  }

  if (
    input.aisleStart < minAisleValue ||
    input.aisleEnd < minAisleValue ||
    input.aisleEnd > maxAisleValue
  ) {
    return getAisleRangeValidationMessage(minAisleValue, maxAisleValue);
  }

  if (input.aisleStart > input.aisleEnd) {
    return VALIDATION_MESSAGES.aisleOrder;
  }

  if (input.shelfStart && input.shelfStart > input.shelfEnd) {
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
  if (!hasValue(input.aisleStart) || !hasValue(input.aisleEnd) || !input.shelfEnd) {
    return [];
  }

  const shelfTokens = getShelfTokens(input.shelfStart ?? 'A', input.shelfEnd);
  const labelsBySide = Object.fromEntries(
    AISLE_SIDES.map((side) => [side, [] as string[]]),
  ) as Record<AisleSide, string[]>;
  const selectedSideCandidates = getAisleSideRanges(input);
  const selectedSides: Array<{ side: AisleSide; start: number; end: number }> =
    selectedSideCandidates
      .filter((range): range is { side: AisleSide; start: number; end: number } => {
        return hasValue(range.start) && hasValue(range.end);
      });

  for (let aisle = input.aisleStart; aisle <= input.aisleEnd; aisle += 1) {
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
  if (!hasValue(input.bayStart) || !hasValue(input.bayEnd) || !input.shelfEnd) {
    return VALIDATION_MESSAGES.shortRequired;
  }

  if (input.bayStart > input.bayEnd) {
    return VALIDATION_MESSAGES.shortOrder;
  }

  if (input.shelfStart && input.shelfStart > input.shelfEnd) {
    return VALIDATION_MESSAGES.shelfOrder;
  }

  if (input.bayStart < minBayValue || input.bayEnd < minBayValue || input.bayEnd > maxBayValue) {
    return getShortBayRangeValidationMessage(minBayValue, maxBayValue);
  }

  return null;
};

export const generateShortLabelCodes = (
  input: IShortLabelInput,
  formatTwoDigitValue: (value: number) => string,
): string[] => {
  if (!hasValue(input.bayStart) || !hasValue(input.bayEnd) || !input.shelfEnd) {
    return [];
  }

  const shelfTokens = getShelfTokens(input.shelfStart ?? 'A', input.shelfEnd);
  const labels: string[] = [];

  for (let bay = input.bayStart; bay <= input.bayEnd; bay += 1) {
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
