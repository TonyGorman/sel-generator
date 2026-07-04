import { describe, expect, it } from 'vitest';
import { clampMm, fitLineByWidth, getSecondaryCenterFromBarcodeTopMm } from './miniCompositionVariantMath';

describe('miniCompositionVariantMath', () => {
  it('clampMm returns min, max, and in-range values as expected', () => {
    expect(clampMm(1, 2, 10)).toBe(2);
    expect(clampMm(12, 2, 10)).toBe(10);
    expect(clampMm(6, 2, 10)).toBe(6);
  });

  it('fitLineByWidth returns max size for empty text', () => {
    const measure = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
      return text.length * fontSizeMm + letterSpacingMm;
    };

    expect(fitLineByWidth('', 4, 10, 20, 0.1, measure)).toBe(10);
  });

  it('fitLineByWidth returns min size when available width is non-positive', () => {
    const measure = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
      return text.length * fontSizeMm + letterSpacingMm;
    };

    expect(fitLineByWidth('ABCDE', 4, 10, 0, 0.1, measure)).toBe(4);
  });

  it('fitLineByWidth returns max size when text fits at max size', () => {
    const measure = (text: string, fontSizeMm: number): number => text.length * fontSizeMm;

    expect(fitLineByWidth('AB', 4, 10, 25, 0, measure)).toBe(10);
  });

  it('fitLineByWidth returns first pass when re-measurement is non-positive', () => {
    const maxSizeMm = 10;
    const measure = (_text: string, fontSizeMm: number): number => {
      if (fontSizeMm === maxSizeMm) {
        return 100;
      }

      return 0;
    };

    // firstPass = clamp(10 * (40 / 100), 4, 10) = 4
    expect(fitLineByWidth('ABCDE', 4, maxSizeMm, 40, 0, measure)).toBe(4);
  });

  it('fitLineByWidth refines size when text needs fitting', () => {
    const measure = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
      return text.length * fontSizeMm + Math.max(text.length - 1, 0) * letterSpacingMm;
    };

    expect(fitLineByWidth('ABCDE', 4, 10, 30, 0, measure)).toBe(6);
  });

  it('getSecondaryCenterFromBarcodeTopMm uses bottom padding and half text size', () => {
    expect(getSecondaryCenterFromBarcodeTopMm(20, 6, 2)).toBe(15);
  });
});
