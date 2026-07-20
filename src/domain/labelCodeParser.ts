import { AisleSide, IAisleCodeParts } from '../models/IAisleCodeParts';
import { IShortCodeParts } from '../models/IShortCodeParts';
import { ISpecialCodeParts } from '../models/ISpecialCodeParts';
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
  | { kind: 'special'; parts: ISpecialCodeParts }
  | { kind: 'aisle'; parts: IAisleCodeParts }
  | { kind: 'short'; parts: IShortCodeParts };

const aisleCodePattern = buildCompactLabelCodePattern();

const parseCompactAisleCode = (code: string): IAisleCodeParts | null => {
  const match = code.match(aisleCodePattern);
  if (!match) {
    return null;
  }

  const [, aisle, side, bay, shelf] = match;
  return { aisle, side: side as AisleSide, bay, shelf };
};

const normalizeConfiguredAislePrefixes = (prefixes: readonly string[]): string[] => {
  const normalizedConfiguredPrefixes = normalizePrefix(prefixes).filter((prefix) => isAislePrefix(prefix));

  return Array.from(new Set(normalizedConfiguredPrefixes)).sort((left, right) => right.length - left.length);
};

// AISLE_PREFIXES is a static `as const` constant, so this pattern is identical
// for every parse call. Build once at module load instead of per label.
const configuredAisleCodePattern = buildCompactConfiguredAisleCodePattern(
  normalizeConfiguredAislePrefixes(AISLE_PREFIXES),
);

// Short-code patterns are a pure function of the prefix string; cache them
// so repeated parses reuse the same RegExp instance.
const shortCodePatternCache = new Map<string, RegExp>();
const getShortCodePattern = (prefix: string): RegExp => {
  let pattern = shortCodePatternCache.get(prefix);
  if (pattern === undefined) {
    pattern = buildCompactShortCodePattern(prefix);
    shortCodePatternCache.set(prefix, pattern);
  }
  return pattern;
};

const parseCompactConfiguredAisleCode = (code: string): IAisleCodeParts | null => {
  if (!configuredAisleCodePattern) {
    return null;
  }

  const match = code.match(configuredAisleCodePattern);
  if (!match) {
    return null;
  }

  const [, prefix, aisleNumber, side, bay, shelf] = match;
  return {
    aisle: `${prefix}${aisleNumber}`,
    side: side as AisleSide,
    bay,
    shelf,
  };
};

const parseCompactShortCode = (code: string, normalizedShortCodePrefix: string): IShortCodeParts | null => {
  const match = code.match(getShortCodePattern(normalizedShortCodePrefix));
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
    return { kind: 'special', parts: { value: specialAisle } };
  }

  const configuredAisleCode = parseCompactConfiguredAisleCode(normalizedCode);
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
