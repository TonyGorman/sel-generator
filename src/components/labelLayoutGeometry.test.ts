import { describe, expect, it } from 'vitest';
import {
  estimatePrimaryTextWidthMm,
  fitMiniPrimaryFontSizeMm,
  getMiniAisleThreeRowGeometry,
  getMiniBarcodeTopFromTileTopMm,
  getPdfBaselineFromCenterMm,
} from './labelLayoutGeometry';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';

const createMiniStrategy = (): ILabelLayoutStrategy => ({
  mode: 'mini-sel',
  displayName: 'Mini',
  page: {
    sheetWidthMm: 297,
    sheetHeightMm: 210,
    orientation: 'landscape',
    pagePadLeftMm: 11,
    pagePadRightMm: 12,
    pagePadTopMm: 7.5,
    pagePadBottomMm: 7.5,
    labelWidthMm: 39,
    labelHeightMm: 39,
    columns: 7,
    rows: 5,
  },
  typography: {
    primaryTextSizeMm: 9,
    primaryTextMinSizeMm: 4,
    primaryTextMaxSizeMm: 9,
    primaryAutoFitEnabled: true,
    secondaryTextSizeMm: 3,
    primaryLetterSpacingMm: 0.2,
    primaryCenterFromTileTopMm: 12,
    secondaryBaselineFromTileTopMm: 20,
    secondaryDomTopOffsetMm: 0.5,
    pdfTextBaselineOffsetFactor: 0.35,
    pdfEncodedTextBaselineOffsetFactor: 0.3,
    barcodeModuleThicknessMm: 0.35,
    barcodeHeightMm: 10,
    tilePaddingHorizontalMm: 1,
    tilePaddingTopMm: 1,
    tilePaddingBottomMm: 1,
    largePrefixTextSizeMm: 8,
    largeMainTextSizeMm: 26,
    largeSuffixTextSizeMm: 8,
  },
  barcodeGeometry: {
    widthMm: 26,
    heightMm: 10,
    marginBottomMm: 2,
  },
});

describe('labelLayoutGeometry', () => {
  it('estimates primary text width and returns 0 for empty text', () => {
    expect(estimatePrimaryTextWidthMm('', 9, 0.2)).toBe(0);

    const expected = 3 * 9 * 0.62 + 2 * 0.2;
    expect(estimatePrimaryTextWidthMm('ABC', 9, 0.2)).toBeCloseTo(expected, 5);
  });

  it('returns max font size when mode is not mini-sel or auto-fit is disabled', () => {
    const mini = createMiniStrategy();
    const largeMode = { ...mini, mode: 'large-sel' as const };
    expect(fitMiniPrimaryFontSizeMm('LONGTEXT', largeMode)).toBe(mini.typography.primaryTextMaxSizeMm);

    const noAutoFit = {
      ...mini,
      typography: { ...mini.typography, primaryAutoFitEnabled: false },
    };
    expect(fitMiniPrimaryFontSizeMm('LONGTEXT', noAutoFit)).toBe(mini.typography.primaryTextMaxSizeMm);
  });

  it('returns max for empty primary text and min when available width is non-positive', () => {
    const mini = createMiniStrategy();
    expect(fitMiniPrimaryFontSizeMm('', mini)).toBe(mini.typography.primaryTextMaxSizeMm);

    const noSpace = {
      ...mini,
      page: { ...mini.page, labelWidthMm: 1 },
      typography: { ...mini.typography, tilePaddingHorizontalMm: 1 },
    };
    expect(fitMiniPrimaryFontSizeMm('ANY', noSpace)).toBe(mini.typography.primaryTextMinSizeMm);
  });

  it('keeps max when text already fits and clamps to min when far too long', () => {
    const mini = createMiniStrategy();
    const fitsAtMax = () => 1;
    expect(fitMiniPrimaryFontSizeMm('SHORT', mini, fitsAtMax)).toBe(mini.typography.primaryTextMaxSizeMm);

    const hugeMeasure = () => 1_000_000;
    expect(fitMiniPrimaryFontSizeMm('VERYLONGVALUE', mini, hugeMeasure)).toBe(mini.typography.primaryTextMinSizeMm);
  });

  it('returns first pass when measured width collapses to zero at first pass', () => {
    const mini = createMiniStrategy();
    const measure = (_text: string, fontSizeMm: number) => (fontSizeMm >= mini.typography.primaryTextMaxSizeMm ? 500 : 0);

    const result = fitMiniPrimaryFontSizeMm('VALUE', mini, measure);

    expect(result).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm);
    expect(result).toBeLessThanOrEqual(mini.typography.primaryTextMaxSizeMm);
  });

  it('computes stacked mini and PDF geometry offsets', () => {
    const mini = createMiniStrategy();
    const geometry = getMiniAisleThreeRowGeometry(mini);

    expect(geometry.topCenterFromContentTopMm).toBeGreaterThan(0);
    expect(geometry.mainCenterFromContentTopMm).toBeGreaterThan(geometry.topCenterFromContentTopMm);
    expect(geometry.bottomCenterFromContentTopMm).toBeGreaterThan(geometry.mainCenterFromContentTopMm);
    expect(geometry.auxTextSizeMm).toBeGreaterThan(0);
    expect(geometry.mainMaxTextSizeMm).toBeGreaterThan(geometry.auxTextSizeMm);

    expect(getMiniBarcodeTopFromTileTopMm(mini)).toBe(
      mini.page.labelHeightMm -
        mini.typography.tilePaddingBottomMm -
        mini.barcodeGeometry.marginBottomMm -
        mini.barcodeGeometry.heightMm,
    );

    expect(getPdfBaselineFromCenterMm(10, 2, 0.5)).toBe(11);
  });
});
