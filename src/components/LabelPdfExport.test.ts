import { describe, expect, it, vi } from 'vitest';
import { drawVectorPage, type JsBarcodeFn, type JsPdfInstance } from './LabelPdfExport';
import {SHORT_CODE_PREFIXES} from '../config/labelConfig';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { fitMiniPrimaryFontSizeMm, getMiniAisleThreeRowGeometry, getPdfBaselineFromCenterMm } from './labelLayoutGeometry';

const MM_TO_PT = 72 / 25.4;
const mmToPt = (mm: number): number => mm * MM_TO_PT;

const createPdfMock = () => {
  const textCalls: Array<{ text: string; x: number; y: number; options?: { align?: 'center' | 'left' | 'right' } }> = [];
  let currentFontSizePt = 12;

  const pdf: JsPdfInstance = {
    addPage: vi.fn(),
    rect: vi.fn(),
    setLineWidth: vi.fn(),
    setDrawColor: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn((size: number) => {
      currentFontSizePt = size;
    }),
    setCharSpace: vi.fn(),
    getTextWidth: vi.fn((text: string) => {
      const fontSizeMm = currentFontSizePt / MM_TO_PT;
      return text.length * fontSizeMm * 0.42;
    }),
    text: vi.fn((text: string, x: number, y: number, options?: { align?: 'center' | 'left' | 'right' }) => {
      textCalls.push({ text, x, y, options });
    }),
    addImage: vi.fn(),
    save: vi.fn(),
  };

  return { pdf, textCalls };
};

const jsBarcodeStub: JsBarcodeFn = (element) => {
  element.setAttribute('viewBox', '0 0 100 20');
};

const svg2pdfStub = vi.fn(async () => undefined);

describe('drawVectorPage', () => {
  it('draws encoded barcode text under barcode in mini-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['01L01A'],
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01L01A')).toBe(true);
  });

  it('renders mini-sel stacked rows for aisle values in PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['01L01A'],
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01')).toBe(true);
    expect(textCalls.some((call) => call.text === 'L01')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
    expect(textCalls.some((call) => call.text === '01 L01 A')).toBe(false);
  });

  it('renders mini-sel stacked rows for short-code values in PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      [`${SHORT_CODE_PREFIXES[0]}01A`],
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === SHORT_CODE_PREFIXES[0])).toBe(true);
    expect(textCalls.some((call) => call.text === '01')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
    expect(textCalls.some((call) => call.text === `${SHORT_CODE_PREFIXES[0]} 01 A`)).toBe(false);
  });

  it('shrinks long mini-sel primary text in PDF output to avoid overflow', async () => {
    const { pdf, textCalls } = createPdfMock();
    const miniStrategy = getLabelLayoutStrategy('mini-sel');
    const miniAisleGeometry = getMiniAisleThreeRowGeometry(miniStrategy);

    await drawVectorPage(
      pdf,
      ['LONGSHELFTOKEN999'],
      miniStrategy,
      jsBarcodeStub,
      svg2pdfStub,
    );

    const primaryCall = textCalls.find((call) => call.text === 'LONGSHELFTOKEN999');
    const centerFromTileTopMm =
      miniStrategy.typography.tilePaddingTopMm + miniAisleGeometry.mainCenterFromContentTopMm;
    const baselineAtMaxMm =
      miniStrategy.page.pagePadTopMm +
      getPdfBaselineFromCenterMm(
        centerFromTileTopMm,
        miniAisleGeometry.mainMaxTextSizeMm,
        miniStrategy.typography.pdfTextBaselineOffsetFactor,
      );
    const baselineAtMinMm =
      miniStrategy.page.pagePadTopMm +
      getPdfBaselineFromCenterMm(
        centerFromTileTopMm,
        miniStrategy.typography.primaryTextMinSizeMm,
        miniStrategy.typography.pdfTextBaselineOffsetFactor,
      );

    expect(primaryCall).toBeDefined();
    expect(primaryCall?.y).toBeLessThanOrEqual(baselineAtMaxMm);
    expect(primaryCall?.y).toBeGreaterThanOrEqual(baselineAtMinMm);
  });

  it('positions mini-sel primary text from stacked main-row center anchor in PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();
    const miniStrategy = getLabelLayoutStrategy('mini-sel');
    const miniAisleGeometry = getMiniAisleThreeRowGeometry(miniStrategy);

    await drawVectorPage(
      pdf,
      ['01L01A'],
      miniStrategy,
      jsBarcodeStub,
      svg2pdfStub,
    );

    const primaryCall = textCalls.find((call) => call.text === 'L01');
    const expectedPrimaryFontMm = Math.min(
      fitMiniPrimaryFontSizeMm('L01', miniStrategy, (text: string, fontSizeMm: number, letterSpacingMm: number) => {
        const glyphWidth = text.length * fontSizeMm * 0.42;
        const spacingWidth = Math.max(text.length - 1, 0) * letterSpacingMm;
        return glyphWidth + spacingWidth;
      }),
      miniAisleGeometry.mainMaxTextSizeMm,
    );

    expect(primaryCall).toBeDefined();
    expect(primaryCall?.y).toBeCloseTo(
      miniStrategy.page.pagePadTopMm +
      getPdfBaselineFromCenterMm(
        miniStrategy.typography.tilePaddingTopMm + miniAisleGeometry.mainCenterFromContentTopMm,
        expectedPrimaryFontMm,
        miniStrategy.typography.pdfTextBaselineOffsetFactor,
      ),
      5,
    );
  });

  it('draws encoded barcode text under barcode in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['01L01A'],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01L01A')).toBe(true);
  });

  it('draws encoded prefixed aisle barcode text under barcode in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['BR1L01A'],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === 'BR1L01A')).toBe(true);
  });

  it('uses structured heading parts for aisle codes in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['31L03A'],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '31')).toBe(true);
    expect(textCalls.some((call) => call.text === 'L03')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
  });

  it('uses structured heading parts for prefixed aisle codes in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['BR1L03A'],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === 'BR1')).toBe(true);
    expect(textCalls.some((call) => call.text === 'L03')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
  });

  it('uses structured heading parts for back codes in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      [`${SHORT_CODE_PREFIXES[0]}01A`],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === SHORT_CODE_PREFIXES[0])).toBe(true);
    expect(textCalls.some((call) => call.text === '01')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
  });

  it('uses structured heading parts for front-of-store codes in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      [`${SHORT_CODE_PREFIXES[1]}01A`],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === SHORT_CODE_PREFIXES[1])).toBe(true);
    expect(textCalls.some((call) => call.text === '01')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
  });

  it('uses primary heading fallback for special aisles in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['FLORAL'],
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === 'FLORAL')).toBe(true);
  });

  it('renders prefixed aisle token as top row in mini PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['BR1L01A'],
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === 'BR1')).toBe(true);
    expect(textCalls.some((call) => call.text === 'L01')).toBe(true);
    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
    expect(textCalls.some((call) => call.text === 'BR1 L01 A')).toBe(false);
  });
});
