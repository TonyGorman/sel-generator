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
    parsed: Extract<ParsedLabelCode, { kind: 'special' | 'aisle' | 'short' }>;
  }
  | {
    ok: false;
    reason: SpecificLabelValidationErrorReason;
  };

export interface ISpecificLabelValidationOptions {
  shortCodePrefixes?: readonly string[];
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
  maxShelfLetter: string;
}

const isShelfTokenValid = (token: string, maxShelfLetter: string): boolean => {
  if (!/^[A-Z]$/.test(token) || !/^[A-Z]$/.test(maxShelfLetter)) {
    return false;
  }

  const shelfIndex = token.charCodeAt(0) - 64;
  const maxShelfIndex = maxShelfLetter.charCodeAt(0) - 64;
  return shelfIndex >= 1 && shelfIndex <= maxShelfIndex;
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
    options.shortCodePrefixes,
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

    if (!isShelfTokenValid(shelf, options.maxShelfLetter)) {
      return { ok: false, reason: 'invalid-shelf-range' };
    }

    return { ok: true, parsed };
  }

  if (parsed.kind === 'short') {
    const { bay, shelf } = parsed.parts;
    if (!isBoundedTwoDigitNumber(bay, options.maxBayValue)) {
      return { ok: false, reason: 'invalid-bay-range' };
    }

    if (!isShelfTokenValid(shelf, options.maxShelfLetter)) {
      return { ok: false, reason: 'invalid-shelf-range' };
    }

    return { ok: true, parsed };
  }

  return { ok: false, reason: 'unsupported-kind' };
};
