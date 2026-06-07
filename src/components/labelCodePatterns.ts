export const AISLE_TOKEN_PATTERN = '\\d{2}';
export const AISLE_SIDE_PATTERN = '[LREF]';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildCompactAisleCodePattern = (): RegExp => {
  return new RegExp(`^(${AISLE_TOKEN_PATTERN})(${AISLE_SIDE_PATTERN})(\\d{2})([A-Z0-9]+)$`);
};

export const buildDashedAisleCodePattern = (ignoreCase: boolean = false): RegExp => {
  return ignoreCase
    ? new RegExp(`^(${AISLE_TOKEN_PATTERN})-(${AISLE_SIDE_PATTERN})(\\d{2})-([A-Z0-9]+)$`, 'i')
    : new RegExp(`^(${AISLE_TOKEN_PATTERN})-(${AISLE_SIDE_PATTERN})(\\d{2})-([A-Z0-9]+)$`);
};

export const buildDashedAisleSideBayPattern = (ignoreCase: boolean = false): RegExp => {
  return ignoreCase
    ? new RegExp(`^(${AISLE_TOKEN_PATTERN})-([A-Z]\\d{2})-([A-Z0-9]+)$`, 'i')
    : new RegExp(`^(${AISLE_TOKEN_PATTERN})-([A-Z]\\d{2})-([A-Z0-9]+)$`);
};

export const buildCompactBackCodePattern = (backCodePrefix: string, ignoreCase: boolean = true): RegExp => {
  const escapedPrefix = escapeRegExp(backCodePrefix);
  return ignoreCase
    ? new RegExp(`^${escapedPrefix}(\\d{2})([A-Z0-9]+)$`, 'i')
    : new RegExp(`^${escapedPrefix}(\\d{2})([A-Z0-9]+)$`);
};

export const buildDashedBackCodePattern = (backCodePrefix: string, ignoreCase: boolean = true): RegExp => {
  const escapedPrefix = escapeRegExp(backCodePrefix);
  return ignoreCase
    ? new RegExp(`^${escapedPrefix}-(\\d{2})-([A-Z0-9]+)$`, 'i')
    : new RegExp(`^${escapedPrefix}-(\\d{2})-([A-Z0-9]+)$`);
};