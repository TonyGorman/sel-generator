import { describe, expect, it } from 'vitest';
import {
  SHORT_CODE_PREFIXES,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  SPECIAL_AISLE_VALUES,
  PDF_EXPORT_SCALE,
  PDF_IMAGE_COMPRESSION,
  formatTwoDigitValue,
  isSpecialAisleValue,
  isShortCodePrefix,
  normalizeAllowedValue,
  normalizePrefix,
} from './labelConfig';

describe('labelConfig', () => {
  it('keeps the published range limits stable', () => {
    expect(MIN_AISLE_VALUE).toBe(0);
    expect(MAX_AISLE_VALUE).toBe(99);
    expect(MAX_BAY_VALUE).toBe(99);
    expect(MAX_SHELF_LETTER).toBe('L');
  });

  it('keeps PDF export profile stable for scan reliability', () => {
    expect(PDF_EXPORT_SCALE).toBe(3);
    expect(PDF_IMAGE_COMPRESSION).toBe('NONE');
  });

  it('keeps Back prefix default stable', () => {
    expect(SHORT_CODE_PREFIXES[0]).toBe('BAK');
    expect(SHORT_CODE_PREFIXES[1]).toBe('FOS');
    expect(SHORT_CODE_PREFIXES).toEqual([SHORT_CODE_PREFIXES[0], SHORT_CODE_PREFIXES[1]]);
  });

  it('keeps named aisle allowlist stable and case-insensitive', () => {
    expect(SPECIAL_AISLE_VALUES).toEqual(['FLORAL', 'KIOSK', 'SEASONAL']);
    expect(isSpecialAisleValue('KIOSK')).toBe(true);
    expect(isSpecialAisleValue('floral')).toBe(true);
    expect(isSpecialAisleValue('PRODUCE')).toBe(false);
    expect(normalizeAllowedValue(' kiosk ', SPECIAL_AISLE_VALUES)).toBe('KIOSK');
    expect(normalizeAllowedValue('FLORAL', SPECIAL_AISLE_VALUES)).toBe('FLORAL');
    expect(normalizeAllowedValue('produce', SPECIAL_AISLE_VALUES)).toBeNull();
  });

  it('normalizes Short code prefix values for config safety', () => {
    expect(normalizeAllowedValue('bak', SHORT_CODE_PREFIXES)).toBe('BAK');
    expect(normalizeAllowedValue('fos', SHORT_CODE_PREFIXES)).toBe('FOS');
    expect(normalizeAllowedValue('9-9', SHORT_CODE_PREFIXES)).toBeNull();
    expect(normalizeAllowedValue('bakk', SHORT_CODE_PREFIXES)).toBeNull();
    expect(normalizeAllowedValue('', SHORT_CODE_PREFIXES)).toBeNull();
  });

  it('validates supported Short code prefixes', () => {
    expect(isShortCodePrefix('BAK')).toBe(true);
    expect(isShortCodePrefix('FOS')).toBe(true);
    expect(isShortCodePrefix('bak')).toBe(true);
    expect(isShortCodePrefix('fos')).toBe(true);
    expect(isShortCodePrefix('99')).toBe(false);
    expect(isShortCodePrefix('XYZ')).toBe(false);
  });

  it('formats two-digit values with leading zeros for label code consistency', () => {
    expect(formatTwoDigitValue(1)).toBe('01');
    expect(formatTwoDigitValue(10)).toBe('10');
  });


  it('normalizes value lists without truncation', () => {
    expect(normalizePrefix([' kiosk ', 'Floral123', 'Bakwall', 'ProduceZone'])).toEqual([
      'KIOSK',
      'FLORAL',
      'BAKWALL',
      'PRODUCEZONE',
    ]);
  });
});
