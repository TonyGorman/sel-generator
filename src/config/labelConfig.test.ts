import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BACK_CODE_PREFIX,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_VALUE,
  SPECIAL_AISLE_VALUES,
  PDF_EXPORT_SCALE,
  PDF_IMAGE_COMPRESSION,
  convertShelfTokenToLetter,
  convertShelfTokenToNumber,
  formatTwoDigitValue,
  formatShelfTokenForStyle,
  getShelfTokenForConfig,
  isSpecialAisleValue,
  normalizeBackCodePrefix,
  normalizeSpecialAisleValue,
  normalizeSpecialAisleValues,
} from './labelConfig';

describe('labelConfig', () => {
  it('keeps the published range limits stable', () => {
    expect(MIN_AISLE_VALUE).toBe(0);
    expect(MAX_AISLE_VALUE).toBe(99);
    expect(MAX_BAY_VALUE).toBe(99);
    expect(MAX_SHELF_VALUE).toBe(20);
  });

  it('keeps PDF export profile stable for scan reliability', () => {
    expect(PDF_EXPORT_SCALE).toBe(3);
    expect(PDF_IMAGE_COMPRESSION).toBe('NONE');
  });

  it('keeps Back prefix default stable', () => {
    expect(DEFAULT_BACK_CODE_PREFIX).toBe('BACK');
  });

  it('keeps named aisle allowlist stable and case-insensitive', () => {
    expect(SPECIAL_AISLE_VALUES).toEqual(['KIOSK', 'FLORAL', 'SEASONAL']);
    expect(isSpecialAisleValue('KIOSK')).toBe(true);
    expect(isSpecialAisleValue('floral')).toBe(true);
    expect(isSpecialAisleValue('PRODUCE')).toBe(false);
    expect(normalizeSpecialAisleValue(' kiosk ')).toBe('KIOSK');
    expect(normalizeSpecialAisleValue('FLORAL')).toBe('FLORAL');
    expect(normalizeSpecialAisleValue('produce')).toBeNull();
  });

  it('normalizes Back prefix values for config safety', () => {
    expect(normalizeBackCodePrefix('backk')).toBe('BACK');
    expect(normalizeBackCodePrefix('9-9')).toBe('99');
    expect(normalizeBackCodePrefix('')).toBe(DEFAULT_BACK_CODE_PREFIX);
  });

  it('formats two-digit values with leading zeros for label code consistency', () => {
    expect(formatTwoDigitValue(1)).toBe('01');
    expect(formatTwoDigitValue(10)).toBe('10');
  });

  it('converts shelf tokens to number format', () => {
    expect(convertShelfTokenToNumber('01')).toBe('1');
    expect(convertShelfTokenToNumber('A')).toBe('1');
    expect(convertShelfTokenToNumber('a')).toBe('1');
  });

  it('converts shelf tokens to letter format', () => {
    expect(convertShelfTokenToLetter('1')).toBe('A');
    expect(convertShelfTokenToLetter('26')).toBe('Z');
    expect(convertShelfTokenToLetter('a')).toBe('A');
  });

  it('formats shelf tokens based on selected shelf style', () => {
    expect(formatShelfTokenForStyle('A', 'number')).toBe('1');
    expect(formatShelfTokenForStyle('1', 'alphabetical')).toBe('A');
  });

  it('returns numeric shelf labels when shelf style is number', () => {
    expect(getShelfTokenForConfig(0, 'number')).toBe('1');
    expect(getShelfTokenForConfig(9, 'number')).toBe('10');
  });

  it('returns alphabetic shelf labels when shelf style is alphabetical', () => {
    expect(getShelfTokenForConfig(0, 'alphabetical')).toBe('A');
    expect(getShelfTokenForConfig(19, 'alphabetical')).toBe('T');
  });

  it('normalizes comma-delimited special aisle values with max 8 chars per entry', () => {
    expect(normalizeSpecialAisleValues([' kiosk ', 'Floral123', 'Backwall', 'Backwall', 'ProduceZone'])).toEqual([
      'KIOSK',
      'FLORAL',
      'BACKWALL',
      'PRODUCEZ',
    ]);
  });
});
