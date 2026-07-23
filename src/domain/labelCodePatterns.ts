import { AISLE_SIDES } from '../config/labelConfig';

export const AISLE_TOKEN_PATTERN = '\\d{2}';
export const BAY_TOKEN_PATTERN = '\\d{2}';
export const SHELF_TOKEN_PATTERN = '[A-Z]';
export const AISLE_PREFIX_NUMBER_PATTERN = '\\d{1,2}';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sideAlternation = AISLE_SIDES.map((side) => escapeRegExp(side)).join('|');
export const SIDE_TOKEN_PATTERN = `(?:${sideAlternation})`;

export const buildCompactLabelCodePattern = (): RegExp => {
  return new RegExp(`^(${AISLE_TOKEN_PATTERN})(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};

export const buildCompactConfiguredAisleCodePattern = (configuredAislePrefixes: readonly string[]): RegExp | null => {
  if (configuredAislePrefixes.length === 0) {
    return null;
  }

  const escapedAlternation = Array.from(new Set(configuredAislePrefixes))
    .sort((left, right) => right.length - left.length)
    .map((prefix) => escapeRegExp(prefix))
    .join('|');
  return new RegExp(`^(${escapedAlternation})(${AISLE_PREFIX_NUMBER_PATTERN})(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};

export const buildCompactShortCodePattern = (shortCodePrefix: string): RegExp => {
  const escapedPrefix = escapeRegExp(shortCodePrefix);

  return new RegExp(`^${escapedPrefix}(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};
