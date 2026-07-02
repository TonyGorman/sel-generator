import { afterEach, describe, expect, it, vi } from 'vitest';

const setQuery = (query: string): void => {
  const suffix = query ? `?${query}` : '';
  window.history.replaceState({}, '', `/${suffix}`);
};

const importDrawVectorPageWithQuery = async (query: string) => {
  setQuery(query);
  vi.resetModules();
  const module = await import('./LabelPdfExport');
  return module.drawVectorPage;
};

const MM_TO_PT = 72 / 25.4;

const createPdfMock = () => {
  const textCalls: Array<{ text: string; x: number; y: number; options?: { align?: 'center' | 'left' | 'right' } }> = [];
  let currentFontSizePt = 12;

  const pdf = {
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

const jsBarcodeStub = (element: SVGElement) => {
  element.setAttribute('viewBox', '0 0 100 20');
};

const svg2pdfStub = vi.fn(async () => undefined);

afterEach(() => {
  setQuery('');
  vi.resetModules();
});

describe('LabelPdfExport shelf-emphasis override', () => {
  it('renders shelf-emphasis text rows when query override is set', async () => {
    const drawVectorPage = await importDrawVectorPageWithQuery('miniVariant=mini-shelf-emphasis');
    const { pdf, textCalls } = createPdfMock();

    const { getLabelLayoutStrategy } = await import('../config/labelLayoutStrategies');

    await drawVectorPage(
      pdf,
      ['01L01A'],
      getLabelLayoutStrategy('mini-sel'),
      jsBarcodeStub,
      svg2pdfStub,
    );

    expect(textCalls.some((call) => call.text === 'A')).toBe(true);
    expect(textCalls.some((call) => call.text === '01 L01 A')).toBe(true);
    expect(textCalls.some((call) => call.text === 'L01')).toBe(false);
  });
});
