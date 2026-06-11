import { describe, expect, it, vi } from 'vitest';
import { drawVectorPage, type JsBarcodeFn, type JsPdfInstance } from './LabelPdfExport';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelGenerator } from '../models/ILabelGenerator';

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

const config: ILabelGenerator['config'] = {
  shelfStyle: 'alphabetical',
  backCodePrefix: 'BK',
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
      config,
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01L01A')).toBe(true);
  });

  it('anchors mini-sel secondary text at the configured tile baseline', async () => {
    const { pdf, textCalls } = createPdfMock();
    const miniStrategy = getLabelLayoutStrategy('mini-sel');

    await drawVectorPage(
      pdf,
      ['01L01A'],
      config,
      miniStrategy,
      jsBarcodeStub,
      svg2pdfStub,
    );

    const secondaryCall = textCalls.find((call) => call.text === '01 L01 A');

    expect(secondaryCall).toBeDefined();
    expect(secondaryCall?.y).toBeCloseTo(
      miniStrategy.page.pagePadTopMm + miniStrategy.typography.secondaryBaselineFromTileTopMm,
      5,
    );
  });

  it('shrinks long mini-sel primary text in PDF output to avoid overflow', async () => {
    const { pdf, textCalls } = createPdfMock();
    const miniStrategy = getLabelLayoutStrategy('mini-sel');

    await drawVectorPage(
      pdf,
      ['LONGSHELFTOKEN999'],
      config,
      miniStrategy,
      jsBarcodeStub,
      svg2pdfStub,
    );

    const primaryCall = textCalls.find((call) => call.text === 'LONGSHELFTOKEN999');
    const baselineAtMaxMm =
      miniStrategy.page.pagePadTopMm +
      miniStrategy.typography.primaryCenterFromTileTopMm +
      miniStrategy.typography.primaryTextMaxSizeMm * miniStrategy.typography.pdfTextBaselineOffsetFactor;
    const baselineAtMinMm =
      miniStrategy.page.pagePadTopMm +
      miniStrategy.typography.primaryCenterFromTileTopMm +
      miniStrategy.typography.primaryTextMinSizeMm * miniStrategy.typography.pdfTextBaselineOffsetFactor;

    expect(primaryCall).toBeDefined();
    expect(primaryCall?.y).toBeLessThan(baselineAtMaxMm);
    expect(primaryCall?.y).toBeGreaterThanOrEqual(baselineAtMinMm);
  });

  it('positions mini-sel primary text from shared center anchor in PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();
    const miniStrategy = getLabelLayoutStrategy('mini-sel');

    await drawVectorPage(
      pdf,
      ['01L01A'],
      config,
      miniStrategy,
      jsBarcodeStub,
      svg2pdfStub,
    );

    const primaryCall = textCalls.find((call) => call.text === 'L01');
    const primaryFontPt = (pdf.setFontSize as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const primaryFontMm = primaryFontPt / MM_TO_PT;

    expect(primaryCall).toBeDefined();
    expect(primaryCall?.y).toBeCloseTo(
      miniStrategy.page.pagePadTopMm +
      miniStrategy.typography.primaryCenterFromTileTopMm +
      primaryFontMm * miniStrategy.typography.pdfTextBaselineOffsetFactor,
      5,
    );
  });

  it('draws encoded barcode text under barcode in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['01L01A'],
      config,
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01L01A')).toBe(true);
  });

  it('uses structured heading parts for aisle codes in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['31L03A'],
      config,
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '31 ')).toBe(true);
    expect(textCalls.some((call) => call.text === 'L03')).toBe(true);
    expect(textCalls.some((call) => call.text === ' A')).toBe(true);
  });

  it('uses structured heading parts for back codes in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      [`${config.backCodePrefix}01A`],
      config,
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === `${config.backCodePrefix} `)).toBe(true);
    expect(textCalls.some((call) => call.text === '01')).toBe(true);
    expect(textCalls.some((call) => call.text === ' A')).toBe(true);
  });
});
