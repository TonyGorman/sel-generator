import {
  VALIDATION_MESSAGES,
  getAisleRangeValidationMessage,
  getShortBayRangeValidationMessage,
  getSideBayRangeValidationMessage,
} from '../config/validationMessages';

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
  shelves: string | null;
}

export interface IShortLabelInput {
  bay_start: number | null;
  bay_end: number | null;
  shelves: string | null;
  prefix: string;
}

interface IAisleValidationLimits {
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
}

const hasValue = (value: number | null): value is number => value !== null && Number.isInteger(value);

const getShelfTokens = (lastShelf: string): string[] => {
  const shelfCount = lastShelf.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  return Array.from({ length: shelfCount }, (_, index) => String.fromCharCode('A'.charCodeAt(0) + index));
};

const buildAisleSideCodes = (
  aisle: number,
  side: 'L' | 'R' | 'E' | 'F',
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

  if (!hasValue(input.aisle_start) || !hasValue(input.aisle_end) || !input.shelves) {
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

  const sideRanges = [
    [input.lf_start, input.lf_end],
    [input.rf_start, input.rf_end],
    [input.ef_start, input.ef_end],
    [input.ft_start, input.ft_end],
  ];
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
  if (!hasValue(input.aisle_start) || !hasValue(input.aisle_end) || !input.shelves) {
    return [];
  }

  const shelfTokens = getShelfTokens(input.shelves);
  const labelsBySide: Record<'L' | 'R' | 'E' | 'F', string[]> = {
    L: [],
    R: [],
    E: [],
    F: [],
  };
  const selectedSideCandidates: Array<{
    side: 'L' | 'R' | 'E' | 'F';
    start: number | null;
    end: number | null;
  }> = [
    { side: 'L', start: input.lf_start, end: input.lf_end },
    { side: 'R', start: input.rf_start, end: input.rf_end },
    { side: 'E', start: input.ef_start, end: input.ef_end },
    { side: 'F', start: input.ft_start, end: input.ft_end },
  ];
  const selectedSides: Array<{ side: 'L' | 'R' | 'E' | 'F'; start: number; end: number }> =
    selectedSideCandidates
      .filter((range): range is { side: 'L' | 'R' | 'E' | 'F'; start: number; end: number } => {
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

  return [...labelsBySide.L, ...labelsBySide.R, ...labelsBySide.E, ...labelsBySide.F];
};

export const validateShortLabelInput = (
  input: IShortLabelInput,
  minBayValue: number,
  maxBayValue: number,
): string | null => {
  if (!hasValue(input.bay_start) || !hasValue(input.bay_end) || !input.shelves) {
    return VALIDATION_MESSAGES.shortRequired;
  }

  if (input.bay_start > input.bay_end) {
    return VALIDATION_MESSAGES.shortOrder;
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
  if (!hasValue(input.bay_start) || !hasValue(input.bay_end) || !input.shelves) {
    return [];
  }

  const shelfTokens = getShelfTokens(input.shelves);
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
