import { IAisleCodeParts } from '../models/IAisleCodeParts';
import { IBackCodeParts } from '../models/IBackCodeParts';
import { DEFAULT_BACK_CODE_PREFIX, normalizeBackCodePrefix, normalizeSpecialAisleValue } from '../config/labelConfig';
import {
  buildCompactLabelCodePattern,
  buildCompactBackCodePattern,
} from '../components/labelCodePatterns';

export type ParsedLabelCode =
  | { kind: 'special'; value: string }
  | { kind: 'aisle'; parts: IAisleCodeParts }
  | { kind: 'back'; parts: IBackCodeParts };

const aisleCodePattern = buildCompactLabelCodePattern();

const parseCompactAisleCode = (code: string): IAisleCodeParts | null => {
  const match = code.match(aisleCodePattern);
  if (!match) {
    return null;
  }

  const [, aisle, side, bay, shelf] = match;
  return { aisle, side, bay, shelf };
};

const parseCompactBackCode = (code: string, normalizedBackCodePrefix: string): IBackCodeParts | null => {
  const match = code.match(buildCompactBackCodePattern(normalizedBackCodePrefix));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    bay,
    shelf: shelf.toUpperCase(),
 	};
};

export const parseLabelCode = (
  code: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): ParsedLabelCode | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = code.toUpperCase();

  const specialAisle = normalizeSpecialAisleValue(normalizedCode, specialAisleValues);
  if (specialAisle) {
    return { kind: 'special', value: specialAisle };
  }

  const aisleCode = parseCompactAisleCode(normalizedCode);
  if (aisleCode) {
    return { kind: 'aisle', parts: aisleCode };
  }

  const backCode = parseCompactBackCode(normalizedCode, normalizedPrefix);
  if (backCode) {
    return { kind: 'back', parts: backCode };
  }

  return null;
};
