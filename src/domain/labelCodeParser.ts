import { IAisleCodeParts } from '../models/IAisleCodeParts';
import { IShortCodeParts } from '../models/IShortCodeParts';
import { SHORT_CODE_PREFIXES, SPECIAL_AISLE_VALUES, normalizeAllowedValue, normalizePrefix } from '../config/labelConfig';
import {
  buildCompactLabelCodePattern,
  buildCompactBackCodePattern,
} from '../components/labelCodePatterns';

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

const parseCompactShortCode = (code: string, normalizedShortCodePrefix: string): IShortCodeParts | null => {
  const match = code.match(buildCompactBackCodePattern(normalizedShortCodePrefix));
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

const parseCompactShortCodeByAnySupportedPrefix = (code: string, preferredPrefixes: readonly string[]): IShortCodeParts | null => {
  const prefixes = Array.from(new Set([...preferredPrefixes, ...SHORT_CODE_PREFIXES]));

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
    return { kind: 'special', value: specialAisle };
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
