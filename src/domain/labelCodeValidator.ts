import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';
import type { ParsedLabelCode } from './labelCodeParser';
import { parseLabelCode } from './labelCodeParser';

export type SpecificLabelValidationErrorReason =
  | 'not-compact'
  | 'unparseable'
  | 'unsupported-kind'
  | 'invalid-aisle-range'
  | 'invalid-bay-range'
  | 'invalid-shelf-range';

export type SpecificLabelValidationResult =
  | {
    ok: true;
    parsed: Extract<ParsedLabelCode, { kind: 'special' | 'aisle' | 'back' }>;
  }
  | {
    ok: false;
    reason: SpecificLabelValidationErrorReason;
  };

export interface ISpecificLabelValidationOptions {
  backCodePrefix?: string;
  specialAisleValues?: readonly string[];
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
  maxShelfValue: number;
}

const isShelfTokenValid = (token: string, maxShelfValue: number): boolean => {
  if (/^\d+$/.test(token)) {
    const numericShelf = Number(token);
    return numericShelf >= 1 && numericShelf <= maxShelfValue;
  }

  if (/^[A-Z]$/.test(token)) {
    const shelfIndex = token.charCodeAt(0) - 64;
    return shelfIndex >= 1 && shelfIndex <= maxShelfValue;
  }

  return false;
};

const isBoundedTwoDigitNumber = (value: string, max: number, min: number = 1): boolean => {
  const numericValue = Number(value);
  return numericValue >= min && numericValue <= max;
};

const isAisleTokenValid = (aisleToken: string, minAisleValue: number, maxAisleValue: number): boolean => {
  if (!/^\d{2}$/.test(aisleToken)) {
    return false;
  }

  return isBoundedTwoDigitNumber(aisleToken, maxAisleValue, minAisleValue);
};

export const validateSpecificLabelCode = (
  code: string,
  options: ISpecificLabelValidationOptions,
): SpecificLabelValidationResult => {
  const normalizedCode = code.trim().toUpperCase();
  if (normalizedCode.includes('-') || normalizedCode.includes(' ')) {
    return { ok: false, reason: 'not-compact' };
  }

  const parsed = parseLabelCode(
    normalizedCode,
    options.backCodePrefix,
    options.specialAisleValues,
  );

  if (!parsed) {
    return { ok: false, reason: 'unparseable' };
  }

  if (parsed.kind === 'special') {
    return { ok: true, parsed };
  }

  if (parsed.kind === 'aisle') {
    const { aisle, bay, shelf } = parsed.parts;
    if (!isAisleTokenValid(aisle, options.minAisleValue, options.maxAisleValue)) {
      return { ok: false, reason: 'invalid-aisle-range' };
    }

    if (!isBoundedTwoDigitNumber(bay, options.maxBayValue)) {
      return { ok: false, reason: 'invalid-bay-range' };
    }

    if (!isShelfTokenValid(shelf, options.maxShelfValue)) {
      return { ok: false, reason: 'invalid-shelf-range' };
    }

    return { ok: true, parsed };
  }

  if (parsed.kind === 'back') {
    const { bay, shelf } = parsed.parts;
    if (!isBoundedTwoDigitNumber(bay, options.maxBayValue)) {
      return { ok: false, reason: 'invalid-bay-range' };
    }

    if (!isShelfTokenValid(shelf, options.maxShelfValue)) {
      return { ok: false, reason: 'invalid-shelf-range' };
    }

    return { ok: true, parsed };
  }

  return { ok: false, reason: 'unsupported-kind' };
};
