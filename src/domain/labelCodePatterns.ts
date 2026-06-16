export const AISLE_TOKEN_PATTERN = '\\d{2}';
export const SIDE_TOKEN_PATTERN = '[LREF]';
export const BAY_TOKEN_PATTERN = '\\d{2}';
export const SHELF_TOKEN_PATTERN = '[A-Z]';

export const buildCompactLabelCodePattern = (): RegExp => {
  return new RegExp(`^(${AISLE_TOKEN_PATTERN})(${SIDE_TOKEN_PATTERN})(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};

export const buildCompactShortCodePattern = (shortCodePrefix: string): RegExp => {
  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedPrefix = escapeRegExp(shortCodePrefix);

  return new RegExp(`^${escapedPrefix}(${BAY_TOKEN_PATTERN})(${SHELF_TOKEN_PATTERN})$`);
};
