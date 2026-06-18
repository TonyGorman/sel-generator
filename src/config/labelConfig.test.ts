import { describe, expect, it } from 'vitest';
import {
  AISLE_PREFIXES,
  SHORT_CODE_PREFIXES,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MIN_BAY_VALUE,
  MAX_BAY_VALUE,
  MIN_SHELF_LETTER,
  MAX_SHELF_LETTER,
  SPECIAL_AISLE_VALUES,
  PDF_EXPORT_SCALE,
  PDF_IMAGE_COMPRESSION,
  LABEL_SOFT_LIMIT,
  LABEL_HARD_LIMIT,
  LABEL_CONSTRAINTS,
  formatTwoDigitValue,
  isAislePrefix,
  isSpecialAisleValue,
  isShortCodePrefix,
  normalizeAllowedValue,
  normalizePrefix,
} from './labelConfig';

describe('labelConfig', () => {
  it('keeps the published range limits stable', () => {
    expect(MIN_BAY_VALUE).toBe(1);
    expect(MIN_AISLE_VALUE).toBe(0);
    expect(MAX_AISLE_VALUE).toBe(99);
    expect(MAX_BAY_VALUE).toBe(99);
    expect(MIN_SHELF_LETTER).toBe('A');
    expect(MAX_SHELF_LETTER).toBe('L');
  });

  it('derives exported constraints from LABEL_CONSTRAINTS single source', () => {
    expect(MIN_AISLE_VALUE).toBe(LABEL_CONSTRAINTS.aisle.min);
    expect(MAX_AISLE_VALUE).toBe(LABEL_CONSTRAINTS.aisle.max);
    expect(MIN_BAY_VALUE).toBe(LABEL_CONSTRAINTS.bay.min);
    expect(MAX_BAY_VALUE).toBe(LABEL_CONSTRAINTS.bay.max);
    expect(MIN_SHELF_LETTER).toBe(LABEL_CONSTRAINTS.shelf.min);
    expect(MAX_SHELF_LETTER).toBe(LABEL_CONSTRAINTS.shelf.max);
    expect(AISLE_PREFIXES).toEqual(LABEL_CONSTRAINTS.aisle.prefixes);
    expect(SHORT_CODE_PREFIXES).toEqual(LABEL_CONSTRAINTS.shortCode.prefixes);
    expect(SPECIAL_AISLE_VALUES).toEqual(LABEL_CONSTRAINTS.aisle.specialValues);
    expect(PDF_EXPORT_SCALE).toBe(LABEL_CONSTRAINTS.pdfExport.scale);
    expect(PDF_IMAGE_COMPRESSION).toBe(LABEL_CONSTRAINTS.pdfExport.imageCompression);
    expect(LABEL_SOFT_LIMIT).toBe(LABEL_CONSTRAINTS.labelGeneration.softLimit);
    expect(LABEL_HARD_LIMIT).toBe(LABEL_CONSTRAINTS.labelGeneration.hardLimit);
  });

  it('keeps generation safety limits stable', () => {
    expect(LABEL_SOFT_LIMIT).toBe(500);
    expect(LABEL_HARD_LIMIT).toBe(1000);
    expect(LABEL_SOFT_LIMIT).toBeLessThan(LABEL_HARD_LIMIT);
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

  it('keeps configured aisle prefixes stable and case-insensitive', () => {
    expect(AISLE_PREFIXES).toEqual(['BR', 'BL', 'FL', 'FR']);
    expect(isAislePrefix('BR')).toBe(true);
    expect(isAislePrefix('bl')).toBe(true);
    expect(isAislePrefix(' br ')).toBe(true);
    expect(isAislePrefix('F L')).toBe(false);
    expect(isAislePrefix('PR')).toBe(false);
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
    expect(normalizePrefix([' kiosk ', 'Floral123', 'seasonal', 'ProduceZone'])).toEqual([
      'KIOSK',
      'FLORAL',
      'SEASONAL',
      'PRODUCEZONE',
    ]);
  });
});
