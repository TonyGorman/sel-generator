import {SHORT_CODE_PREFIXES} from '../config/labelConfig';
import { parseLabelCode } from './labelCodeParser';
import { CompactLabelCode, asCompactLabelCode } from '../models/ILabelCode';

export type { CompactLabelCode } from '../models/ILabelCode';

const compactAisleCode = (aisle: string, side: string, bay: string, shelf: string): CompactLabelCode => {
  return asCompactLabelCode(`${aisle}${side}${bay}${shelf}`);
};

const compactBackCode = (prefix: string, bay: string, shelf: string): CompactLabelCode => {
  return asCompactLabelCode(`${prefix}${bay}${shelf}`);
};

export const normalizeLabelCode = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): string => {
  const normalizedCode = code.toUpperCase();
  const parsed = parseLabelCode(normalizedCode, shortCodePrefix);

  if (parsed) {
    if (parsed.kind === 'special') {
      return parsed.parts.value;
    }

    if (parsed.kind === 'aisle') {
      const { aisle, side, bay, shelf } = parsed.parts;
      return `${aisle} ${side}${bay} ${shelf}`;
    }

    if (parsed.kind === 'short') {
      const { prefix, bay, shelf } = parsed.parts;
      return `${prefix} ${bay} ${shelf}`;
    }
  }

  return normalizedCode;
};

export const getEncodedLabelCode = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): CompactLabelCode => {
  const normalizedCode = code.toUpperCase();

  const parsed = parseLabelCode(normalizedCode, shortCodePrefix);
  if (parsed) {
    if (parsed.kind === 'special') {
      return asCompactLabelCode(parsed.parts.value);
    }

    if (parsed.kind === 'aisle') {
      const { aisle, side, bay, shelf } = parsed.parts;
      return compactAisleCode(aisle, side, bay, shelf);
    }

    if (parsed.kind === 'short') {
      const { prefix, bay, shelf } = parsed.parts;
      return compactBackCode(prefix, bay, shelf);
    }
  }

  return asCompactLabelCode(normalizedCode);
};



export interface ILargeLabelDisplayParts {
  prefix: string;
  main: string;
  suffix: string;
}

export interface IMiniThreeRowDisplayParts {
  top: string;
  main: string;
  bottom: string;
}

export const getLargeSelDisplayParts = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): ILargeLabelDisplayParts | null => {
  const parsed = parseLabelCode(code, shortCodePrefix);

  if (parsed?.kind === 'aisle') {
    const { aisle, side, bay, shelf } = parsed.parts;
    return {
      prefix: aisle,
      main: `${side}${bay}`,
      suffix: shelf,
    };
  }

  if (parsed?.kind === 'short') {
    const { prefix, bay, shelf } = parsed.parts;
    return {
      prefix,
      main: bay,
      suffix: shelf,
    };
  }

  return null;
};

export const getMiniThreeRowDisplayParts = (
  code: string,
  shortCodePrefix: string = SHORT_CODE_PREFIXES[0],
): IMiniThreeRowDisplayParts => {
  const normalizedCode = code.toUpperCase();
  const parsed = parseLabelCode(normalizedCode, shortCodePrefix);
  if (!parsed) {
    return {
      top: '',
      main: normalizedCode,
      bottom: '',
    };
  }

  if (parsed.kind === 'aisle') {
    const { aisle, side, bay, shelf } = parsed.parts;
    return {
      top: aisle,
      main: `${side}${bay}`,
      bottom: shelf,
    };
  }

  if (parsed.kind === 'short') {
    const { prefix, bay, shelf } = parsed.parts;
    return {
      top: prefix,
      main: bay,
      bottom: shelf,
    };
  }

  if (parsed.kind === 'special') {
    return {
      top: '',
      main: parsed.parts.value,
      bottom: '',
    };
  }

  const _exhaustiveCheck: never = parsed;
  return _exhaustiveCheck;
};
