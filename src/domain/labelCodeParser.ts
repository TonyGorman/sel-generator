import { IAisleCodeParts } from '../models/IAisleCodeParts';
import { IShortCodeParts } from '../models/IShortCodeParts';
import {
  AISLE_PREFIXES,
  SHORT_CODE_PREFIXES,
  SPECIAL_AISLE_VALUES,
  isAislePrefix,
  isShortCodePrefix,
  normalizeAllowedValue,
  normalizePrefix,
} from '../config/labelConfig';
import {
  buildCompactConfiguredAisleCodePattern,
  buildCompactLabelCodePattern,
  buildCompactShortCodePattern,
} from './labelCodePatterns';

export type ParsedLabelCode =
  | { kind: 'special'; value: string }
  | { kind: 'aisle'; parts: IAisleCodeParts }
  | { kind: 'short'; parts: IShortCodeParts };

const aisleCodePattern = buildCompactLabelCodePattern();

const parseCompactAisleCode = (code: string): IAisleCodeParts | null => {
  const match = code.match(aisleCodePattern);
  if (!match) {
    return null;
  }

  const [, aisle, side, bay, shelf] = match;
  return { aisle, side, bay, shelf };
};

const normalizeConfiguredAislePrefixes = (prefixes: readonly string[]): string[] => {
  const normalizedConfiguredPrefixes = normalizePrefix(prefixes).filter((prefix) => isAislePrefix(prefix));

  return Array.from(new Set(normalizedConfiguredPrefixes)).sort((left, right) => right.length - left.length);
};

const parseCompactConfiguredAisleCode = (
  code: string,
  configuredAislePrefixes: readonly string[],
): IAisleCodeParts | null => {
  const pattern = buildCompactConfiguredAisleCodePattern(configuredAislePrefixes);
  if (!pattern) {
    return null;
  }

  const match = code.match(pattern);
  if (!match) {
    return null;
  }

  const [, prefix, aisleNumber, side, bay, shelf] = match;
  return {
    aisle: `${prefix}${aisleNumber}`,
    side,
    bay,
    shelf,
  };
};

const parseCompactShortCode = (code: string, normalizedShortCodePrefix: string): IShortCodeParts | null => {
  const match = code.match(buildCompactShortCodePattern(normalizedShortCodePrefix));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    prefix: normalizedShortCodePrefix,
    bay,
    shelf: shelf.toUpperCase(),
 	};
};

const filterConfiguredShortCodePrefixes = (prefixes: readonly string[]): string[] => {
  return prefixes.filter((prefix) => isShortCodePrefix(prefix));
};

const parseCompactShortCodeByAnySupportedPrefix = (code: string, preferredPrefixes: readonly string[]): IShortCodeParts | null => {
  const configuredPreferredPrefixes = filterConfiguredShortCodePrefixes(preferredPrefixes);
  const prefixes = Array.from(new Set([...configuredPreferredPrefixes, ...SHORT_CODE_PREFIXES]));

  for (const prefix of prefixes) {
    const parsed = parseCompactShortCode(code, prefix);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const parseCompactAisleCodeByConfiguredPrefix = (code: string): IAisleCodeParts | null => {
  const configuredAislePrefixes = normalizeConfiguredAislePrefixes(AISLE_PREFIXES);

  return parseCompactConfiguredAisleCode(code, configuredAislePrefixes);
};

export const parseLabelCode = (
  code: string,
  shortCodePrefixes: string | readonly string[] = SHORT_CODE_PREFIXES,
): ParsedLabelCode | null => {
  const preferredPrefixes = normalizePrefix(
    Array.isArray(shortCodePrefixes) ? shortCodePrefixes : [shortCodePrefixes],
  );
  const normalizedCode = code.toUpperCase();

  const specialAisle = normalizeAllowedValue(normalizedCode, SPECIAL_AISLE_VALUES);
  if (specialAisle) {
    return { kind: 'special', value: specialAisle };
  }

  const configuredAisleCode = parseCompactAisleCodeByConfiguredPrefix(normalizedCode);
  if (configuredAisleCode) {
    return { kind: 'aisle', parts: configuredAisleCode };
  }

  const aisleCode = parseCompactAisleCode(normalizedCode);
  if (aisleCode) {
    return { kind: 'aisle', parts: aisleCode };
  }

  const shortCode = parseCompactShortCodeByAnySupportedPrefix(normalizedCode, preferredPrefixes);
  if (shortCode) {
    return { kind: 'short', parts: shortCode };
  }

  return null;
};
