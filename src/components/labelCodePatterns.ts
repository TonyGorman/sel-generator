export const AISLE_TOKEN_PATTERN = '\\d{2}';
export const SIDE_TOKEN_PATTERN = '[LREF]';
export const BAY_TOKEN_PATTERN = '\\d{2}';
export const SHELF_TOKEN_PATTERN = '[A-Z0-9]+'; // Revisit if we drop configurable letter or number

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildCompactLabelCodePattern = (): RegExp => {
  return new RegExp(`^(${AISLE_TOKEN_PATTERN})(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};

export const buildSeparatedLabelCodePattern = (ignoreCase: boolean = false): RegExp => {
  return ignoreCase
    ? new RegExp(`^(${AISLE_TOKEN_PATTERN})-(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})-(${SHELF_TOKEN_PATTERN})$`, 'i')
    : new RegExp(`^(${AISLE_TOKEN_PATTERN})-(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})-(${SHELF_TOKEN_PATTERN})$`);
};

export const buildSpacedLabelCodePattern = (ignoreCase: boolean = false): RegExp => {
  return ignoreCase
    ? new RegExp(`^(${AISLE_TOKEN_PATTERN}) (${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN}) (${SHELF_TOKEN_PATTERN})$`, 'i')
    : new RegExp(`^(${AISLE_TOKEN_PATTERN}) (${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN}) (${SHELF_TOKEN_PATTERN})$`);
};

export const buildCompactBackCodePattern = (backCodePrefix: string, ignoreCase: boolean = true): RegExp => {
  const escapedPrefix = escapeRegExp(backCodePrefix);
  return ignoreCase
    ? new RegExp(`^${escapedPrefix}(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`, 'i')
    : new RegExp(`^${escapedPrefix}(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};

export const buildSeparatedBackCodePattern = (backCodePrefix: string, ignoreCase: boolean = true): RegExp => {
  const escapedPrefix = escapeRegExp(backCodePrefix);
  return ignoreCase
    ? new RegExp(`^${escapedPrefix}-(${BAY_TOKEN_PATTERN})-(${SHELF_TOKEN_PATTERN})$`, 'i')
    : new RegExp(`^${escapedPrefix}-(${BAY_TOKEN_PATTERN})-(${SHELF_TOKEN_PATTERN})$`);
};

export const buildSpacedBackCodePattern = (backCodePrefix: string, ignoreCase: boolean = true): RegExp => {
  const escapedPrefix = escapeRegExp(backCodePrefix);
  return ignoreCase
    ? new RegExp(`^${escapedPrefix} (${BAY_TOKEN_PATTERN}) (${SHELF_TOKEN_PATTERN})$`, 'i')
    : new RegExp(`^${escapedPrefix} (${BAY_TOKEN_PATTERN}) (${SHELF_TOKEN_PATTERN})$`);
};