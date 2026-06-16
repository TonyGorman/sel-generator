import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportLabelPdf } from './labelPdfExporter';
import { drawRasterPage, drawVectorPage } from './LabelPdfExport';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';

const {
  jsPDFConstructorMock,
  jsBarcodeMock,
  svg2pdfMock,
  addPageMock,
  saveMock,
} = vi.hoisted(() => {
  const addPage = vi.fn();
  const save = vi.fn();
  const jsPDFConstructor = vi.fn(function jsPDFMock() {
    return {
      addPage,
      save,
    };
  });
  const jsBarcode = vi.fn();
  const svg2pdf = vi.fn(async () => undefined);

  return {
    jsPDFConstructorMock: jsPDFConstructor,
    jsBarcodeMock: jsBarcode,
    svg2pdfMock: svg2pdf,
    addPageMock: addPage,
    saveMock: save,
  };
});

vi.mock('jspdf', () => ({ jsPDF: jsPDFConstructorMock }));
vi.mock('jsbarcode', () => ({ default: jsBarcodeMock }));
vi.mock('svg2pdf.js', () => ({ svg2pdf: svg2pdfMock }));
vi.mock('./LabelPdfExport', () => ({
  drawVectorPage: vi.fn(async () => undefined),
  drawRasterPage: vi.fn(async () => undefined),
}));

const createExportRoot = (hasPrintPage: boolean): HTMLDivElement => {
  const root = document.createElement('div');
  if (hasPrintPage) {
    const page = document.createElement('div');
    page.className = 'print-page';
    root.appendChild(page);
  }

  return root;
};

describe('exportLabelPdf', () => {
  beforeEach(() => {
    vi.mocked(drawVectorPage).mockReset();
    vi.mocked(drawRasterPage).mockReset();
    vi.mocked(drawVectorPage).mockResolvedValue(undefined);
    vi.mocked(drawRasterPage).mockResolvedValue(undefined);
    jsPDFConstructorMock.mockClear();
    addPageMock.mockClear();
    saveMock.mockReset();
    saveMock.mockImplementation(() => undefined);
  });

  it('throws print-pages-missing when export root has no print pages', async () => {
    await expect(
      exportLabelPdf({
        exportRoot: createExportRoot(false),
        printPageClassName: 'print-page',
        pagedItems: [],
        layoutStrategy: getLabelLayoutStrategy('mini-sel'),
      }),
    ).rejects.toMatchObject({ code: 'print-pages-missing' });
  });

  it('throws raster-fallback-failed when vector and raster paths both fail', async () => {
    vi.mocked(drawVectorPage).mockRejectedValueOnce(new Error('vector failed'));
    vi.mocked(drawRasterPage).mockRejectedValueOnce(new Error('raster failed'));

    await expect(
      exportLabelPdf({
        exportRoot: createExportRoot(true),
        printPageClassName: 'print-page',
        pagedItems: [['01L01A']],
        layoutStrategy: getLabelLayoutStrategy('mini-sel'),
      }),
    ).rejects.toMatchObject({ code: 'raster-fallback-failed' });
  });

  it('throws vector-export-failed when saving the PDF fails', async () => {
    saveMock.mockImplementationOnce(() => {
      throw new Error('save failed');
    });

    await expect(
      exportLabelPdf({
        exportRoot: createExportRoot(true),
        printPageClassName: 'print-page',
        pagedItems: [['01L01A']],
        layoutStrategy: getLabelLayoutStrategy('mini-sel'),
      }),
    ).rejects.toMatchObject({ code: 'vector-export-failed' });
  });
});
