import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BACK_CODE_PREFIX,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  SPECIAL_AISLE_VALUES,
  PDF_EXPORT_SCALE,
  PDF_IMAGE_COMPRESSION,
  formatTwoDigitValue,
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
    expect(MAX_SHELF_LETTER).toBe('L');
  });

  it('keeps PDF export profile stable for scan reliability', () => {
    expect(PDF_EXPORT_SCALE).toBe(3);
    expect(PDF_IMAGE_COMPRESSION).toBe('NONE');
  });

  it('keeps Back prefix default stable', () => {
    expect(DEFAULT_BACK_CODE_PREFIX).toBe('BAK');
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

  it('accepts mixed-case configured named aisle allowlists', () => {
    const configuredSpecialAisles = ['kiosk', 'FlOrAl', ' seasonal '];

    expect(normalizeSpecialAisleValue('KIOSK', configuredSpecialAisles)).toBe('KIOSK');
    expect(isSpecialAisleValue('floral', configuredSpecialAisles)).toBe(true);
    expect(normalizeSpecialAisleValue('SEASONAL', configuredSpecialAisles)).toBe('SEASONAL');
  });

  it('normalizes Back prefix values for config safety', () => {
    expect(normalizeBackCodePrefix('bakk')).toBe('BAK');
    expect(normalizeBackCodePrefix('9-9')).toBe('99');
    expect(normalizeBackCodePrefix('')).toBe(DEFAULT_BACK_CODE_PREFIX);
  });

  it('formats two-digit values with leading zeros for label code consistency', () => {
    expect(formatTwoDigitValue(1)).toBe('01');
    expect(formatTwoDigitValue(10)).toBe('10');
  });


  it('normalizes comma-delimited special aisle values with max 8 chars per entry', () => {
    expect(normalizeSpecialAisleValues([' kiosk ', 'Floral123', 'Bakwall', 'ProduceZone'])).toEqual([
      'KIOSK',
      'FLORAL',
      'BAKWALL',
      'PRODUCEZ',
    ]);
  });
});
