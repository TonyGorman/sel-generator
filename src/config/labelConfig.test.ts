import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BACK_CODE_PREFIX,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_VALUE,
  PDF_EXPORT_SCALE,
  PDF_IMAGE_COMPRESSION,
  convertShelfTokenToLetter,
  convertShelfTokenToNumber,
  formatTwoDigitValue,
  formatShelfTokenForStyle,
  getShelfTokenForConfig,
  normalizeBackCodePrefix,
} from './labelConfig';

describe('labelConfig', () => {
  it('keeps the published range limits stable', () => {
    expect(MAX_AISLE_VALUE).toBe(99);
    expect(MAX_BAY_VALUE).toBe(99);
    expect(MAX_SHELF_VALUE).toBe(20);
  });

  it('keeps PDF export profile stable for scan reliability', () => {
    expect(PDF_EXPORT_SCALE).toBe(3);
    expect(PDF_IMAGE_COMPRESSION).toBe('NONE');
  });

  it('keeps Back prefix default stable', () => {
    expect(DEFAULT_BACK_CODE_PREFIX).toBe('BK');
  });

  it('normalizes Back prefix values for config safety', () => {
    expect(normalizeBackCodePrefix('bk')).toBe('BK');
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
});
