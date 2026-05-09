import { describe, expect, it } from 'vitest';
import {
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_VALUE,
  PDF_EXPORT_SCALE,
  PDF_IMAGE_COMPRESSION,
  getShelfTokenForConfig,
} from './barcodeConfig';

describe('barcodeConfig', () => {
  it('keeps the published range limits stable', () => {
    expect(MAX_AISLE_VALUE).toBe(99);
    expect(MAX_BAY_VALUE).toBe(99);
    expect(MAX_SHELF_VALUE).toBe(20);
  });

  it('keeps PDF export profile stable for scan reliability', () => {
    expect(PDF_EXPORT_SCALE).toBe(3);
    expect(PDF_IMAGE_COMPRESSION).toBe('NONE');
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
