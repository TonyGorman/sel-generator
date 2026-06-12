import { DEFAULT_BACK_CODE_PREFIX, normalizeBackCodePrefix } from '../config/labelConfig';
import type { ParsedLabelCode } from './labelCodeParser';
import { parseLabelCode } from './labelCodeParser';

const compactAisleCode = (aisle: string, side: string, bay: string, shelf: string): string => {
  return `${aisle}${side}${bay}${shelf}`;
};

const compactBackCode = (prefix: string, bay: string, shelf: string): string => {
  return `${prefix}${bay}${shelf}`;
};

export const normalizeLabelCode = (
  code: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = code.toUpperCase();
  const parsed = parseLabelCode(normalizedCode, normalizedPrefix, specialAisleValues);

  if (parsed) {
    if (parsed.kind === 'special') {
      return parsed.value;
    }

    if (parsed.kind === 'aisle') {
      const { aisle, side, bay, shelf } = parsed.parts;
      return `${aisle} ${side}${bay} ${shelf}`;
    }

    if (parsed.kind === 'back') {
      const { bay, shelf } = parsed.parts;
      return `${normalizedPrefix} ${bay} ${shelf}`;
    }
  }

  return normalizedCode;
};

export const getEncodedLabelCode = (
  code: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = code.toUpperCase();

  const parsed = parseLabelCode(normalizedCode, normalizedPrefix, specialAisleValues);
  if (parsed) {
    if (parsed.kind === 'special') {
      return parsed.value;
    }

    if (parsed.kind === 'aisle') {
      const { aisle, side, bay, shelf } = parsed.parts;
      return compactAisleCode(aisle, side, bay, shelf);
    }

    if (parsed.kind === 'back') {
      const { bay, shelf } = parsed.parts;
      return compactBackCode(normalizedPrefix, bay, shelf);
    }
  }

  return normalizedCode;
};

export const getPrimaryLabelText = (
  code: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): { primary: string; secondary: string } => {

  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const upperCode = code.toUpperCase();
  const secondaryDisplayValue = normalizeLabelCode(upperCode, normalizedPrefix, specialAisleValues);

  const parsed = parseLabelCode(upperCode, normalizedPrefix, specialAisleValues);
  if (parsed) {
    if (parsed.kind === 'special') {
      return {
        primary: parsed.value,
        secondary: '',
      };
    }

    if (parsed.kind === 'aisle') {
      const { side, bay } = parsed.parts;
      return {
        primary: `${side}${bay}`,
        secondary: secondaryDisplayValue,
      };
    }

    const { bay } = parsed.parts;
    return {
      primary: `${normalizedPrefix}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  return {
    primary: upperCode,
    secondary: secondaryDisplayValue,
  };
};

export interface ILargeLabelDisplayParts {
  prefix: string;
  main: string;
  suffix: string;
}

export const getLargeSelDisplayParts = (
  code: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): ILargeLabelDisplayParts | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const parsed = parseLabelCode(code, normalizedPrefix, specialAisleValues);

  if (parsed?.kind === 'aisle') {
    const { aisle, side, bay, shelf } = parsed.parts;
    return {
      prefix: aisle,
      main: `${side}${bay}`,
      suffix: shelf,
    };
  }

  if (parsed?.kind === 'back') {
    const { bay, shelf } = parsed.parts;
    return {
      prefix: normalizedPrefix,
      main: bay,
      suffix: shelf,
    };
  }

  return null;
};
