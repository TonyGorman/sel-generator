import type { ParsedLabelCode } from './labelCodeParser';
import { parseLabelCode } from './labelCodeParser';
import { AISLE_PREFIXES, isAislePrefix, normalizePrefix } from '../config/labelConfig';

export type SpecificLabelValidationErrorReason =
  | 'not-compact'
  | 'unparseable'
  | 'unsupported-kind'
  | 'invalid-aisle-prefix'
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
  aislePrefixes?: readonly string[];
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

const isBoundedNumericToken = (value: string, max: number, min: number = 1): boolean => {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  const numericValue = Number(value);
  return numericValue >= min && numericValue <= max;
};

const isNumericAisleToken = (aisleToken: string): boolean => {
  return /^\d{2}$/.test(aisleToken);
};

const getConfiguredAislePrefixes = (configuredPrefixes?: readonly string[]): string[] => {
  const normalizedConfiguredPrefixes = normalizePrefix(configuredPrefixes ?? AISLE_PREFIXES);
  return normalizedConfiguredPrefixes.filter((prefix) => isAislePrefix(prefix));
};

const getPrefixedAisleNumberToken = (
  aisleToken: string,
  configuredPrefixes: readonly string[],
): string | null => {
  const sortedPrefixes = [...configuredPrefixes].sort((left, right) => right.length - left.length);
  const matchedPrefix = sortedPrefixes.find((prefix) => aisleToken.startsWith(prefix));
  if (!matchedPrefix) {
    return null;
  }

  return aisleToken.slice(matchedPrefix.length);
};

const getAisleValidationError = (
  aisleToken: string,
  options: Pick<ISpecificLabelValidationOptions, 'aislePrefixes' | 'minAisleValue' | 'maxAisleValue'>,
): Extract<SpecificLabelValidationErrorReason, 'invalid-aisle-prefix' | 'invalid-aisle-range'> | null => {
  if (isNumericAisleToken(aisleToken)) {
    return isBoundedNumericToken(aisleToken, options.maxAisleValue, options.minAisleValue)
      ? null
      : 'invalid-aisle-range';
  }

  const configuredPrefixes = getConfiguredAislePrefixes(options.aislePrefixes);
  const aisleNumberToken = getPrefixedAisleNumberToken(aisleToken, configuredPrefixes);
  if (!aisleNumberToken) {
    return 'invalid-aisle-prefix';
  }

  return isBoundedNumericToken(aisleNumberToken, options.maxAisleValue, options.minAisleValue)
    ? null
    : 'invalid-aisle-range';
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

    const aisleValidationError = getAisleValidationError(aisle, options);
    if (aisleValidationError) {
      return { ok: false, reason: aisleValidationError };
    }

    if (!isBoundedNumericToken(bay, options.maxBayValue)) {
      return { ok: false, reason: 'invalid-bay-range' };
    }

    if (!isShelfTokenValid(shelf, options.maxShelfLetter)) {
      return { ok: false, reason: 'invalid-shelf-range' };
    }

    return { ok: true, parsed };
  }

  if (parsed.kind === 'short') {
    const { bay, shelf } = parsed.parts;
    if (!isBoundedNumericToken(bay, options.maxBayValue)) {
      return { ok: false, reason: 'invalid-bay-range' };
    }

    if (!isShelfTokenValid(shelf, options.maxShelfLetter)) {
      return { ok: false, reason: 'invalid-shelf-range' };
    }

    return { ok: true, parsed };
  }

  return { ok: false, reason: 'unsupported-kind' };
};
