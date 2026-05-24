import { describe, expect, it, vi } from 'vitest';
import { drawVectorPage, type JsBarcodeFn, type JsPdfInstance } from './LabelPdfExport';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelGenerator } from '../models/ILabelGenerator';

const createPdfMock = () => {
  const textCalls: Array<{ text: string; x: number; y: number; options?: { align?: 'center' | 'left' | 'right' } }> = [];

  const pdf: JsPdfInstance = {
    addPage: vi.fn(),
    rect: vi.fn(),
    setLineWidth: vi.fn(),
    setDrawColor: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setCharSpace: vi.fn(),
    getTextWidth: vi.fn((text: string) => text.length),
    text: vi.fn((text: string, x: number, y: number, options?: { align?: 'center' | 'left' | 'right' }) => {
      textCalls.push({ text, x, y, options });
    }),
    addImage: vi.fn(),
    save: vi.fn(),
  };

  return { pdf, textCalls };
};

const config: ILabelGenerator['config'] = {
  primaryCodeFormat: 'sideAndBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
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
      'Aisle',
      config,
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01L01A')).toBe(true);
  });

  it('draws encoded barcode text under barcode in large-sel PDF output', async () => {
    const { pdf, textCalls } = createPdfMock();

    await drawVectorPage(
      pdf,
      ['01L01A'],
      'Aisle',
      config,
      getLabelLayoutStrategy('large-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === '01L01A')).toBe(true);
  });
});
