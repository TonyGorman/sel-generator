import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LabelGenerator, { getDownloadErrorMessage } from './LabelGenerator';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { LabelPdfExportError, type LabelPdfExportErrorCode } from './labelPdfExportError';

const {
  addPageMock,
  rectMock,
  setLineWidthMock,
  setDrawColorMock,
  setTextColorMock,
  setFontMock,
  setFontSizeMock,
  setCharSpaceMock,
  textMock,
  addImageMock,
  saveMock,
  jsPDFConstructorMock,
  jsBarcodeMock,
  svg2pdfMock,
  toDataUrlMock,
  html2CanvasMock,
} = vi.hoisted(() => {
  const addPage = vi.fn();
  const rect = vi.fn();
  const setLineWidth = vi.fn();
  const setDrawColor = vi.fn();
  const setTextColor = vi.fn();
  const setFont = vi.fn();
  const setFontSize = vi.fn();
  const setCharSpace = vi.fn();
  const text = vi.fn();
  const addImage = vi.fn();
  const save = vi.fn();
  const jsPDFConstructor = vi.fn(function jsPDFMock() {
    return {
      addPage,
      rect,
      setLineWidth,
      setDrawColor,
      setTextColor,
      setFont,
      setFontSize,
      setCharSpace,
      text,
      addImage,
      save,
    };
  });
  const jsBarcode = vi.fn();
  const svg2pdf = vi.fn(async () => undefined);
  const toDataUrl = vi.fn(() => 'data:image/png;base64,fake');
  const html2Canvas = vi.fn(async () => ({ toDataURL: toDataUrl }));

  return {
    addPageMock: addPage,
    rectMock: rect,
    setLineWidthMock: setLineWidth,
    setDrawColorMock: setDrawColor,
    setTextColorMock: setTextColor,
    setFontMock: setFont,
    setFontSizeMock: setFontSize,
    setCharSpaceMock: setCharSpace,
    textMock: text,
    addImageMock: addImage,
    saveMock: save,
    jsPDFConstructorMock: jsPDFConstructor,
    jsBarcodeMock: jsBarcode,
    svg2pdfMock: svg2pdf,
    toDataUrlMock: toDataUrl,
    html2CanvasMock: html2Canvas,
  };
});

vi.mock('jspdf', () => ({ jsPDF: jsPDFConstructorMock }));
vi.mock('jsbarcode', () => ({ default: jsBarcodeMock }));
vi.mock('svg2pdf.js', () => ({ svg2pdf: svg2pdfMock }));
vi.mock('html2canvas', () => ({ default: html2CanvasMock }));

vi.mock('./LabelTile', () => ({
  default: ({ code }: { code: string }) => <div>{code}</div>,
  normalizeLabelCode: (code: string) => code,
  getEncodedLabelCode: (code: string) => code,
  getMiniPrimaryFontSizeMm: () => 13,

  getLargeSelDisplayParts: () => null,
}));

vi.mock('./Pagination', () => ({
  default: ({ onPageChange }: { onPageChange: (items: string[]) => void }) => (
    <button data-testid="pagination-trigger" onClick={() => onPageChange(['MANUAL'])}>Paginate</button>
  ),
}));

describe('LabelGenerator PDF export', () => {
  beforeEach(() => {
    addPageMock.mockReset();
    rectMock.mockReset();
    setLineWidthMock.mockReset();
    setDrawColorMock.mockReset();
    setTextColorMock.mockReset();
    setFontMock.mockReset();
    setFontSizeMock.mockReset();
    setCharSpaceMock.mockReset();
    textMock.mockReset();
    addImageMock.mockReset();
    saveMock.mockReset();
    jsPDFConstructorMock.mockClear();
    jsBarcodeMock.mockClear();
    svg2pdfMock.mockClear();
    toDataUrlMock.mockClear();
    html2CanvasMock.mockClear();
  });

  it('exports all pages with vector label rendering in one landscape A4 PDF', async () => {
    const labelCodes = Array.from({ length: 40 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`);
    render(<LabelGenerator labelCodes={labelCodes} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Labels' }));

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith('labels.pdf');
    });

    expect(jsPDFConstructorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orientation: 'landscape',
        unit: 'mm',
        format: [296, 210],
        compress: true,
      }),
    );
    expect(jsBarcodeMock).toHaveBeenCalledTimes(40);
    expect(svg2pdfMock).toHaveBeenCalledTimes(40);
    expect(html2CanvasMock).not.toHaveBeenCalled();
    expect(addPageMock).toHaveBeenCalledTimes(1);
    expect(addImageMock).not.toHaveBeenCalled();
  });

  it('falls back to raster page capture if vector conversion fails', async () => {
    svg2pdfMock.mockRejectedValueOnce(new Error('svg fail'));

    const labelCodes = ['01L01A'];
    render(<LabelGenerator labelCodes={labelCodes} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Labels' }));

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith('labels.pdf');
    });

    expect(html2CanvasMock).toHaveBeenCalledTimes(1);
    expect(addImageMock).toHaveBeenCalledTimes(1);
    expect(addImageMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('data:image/png;base64,'),
      'PNG',
      0,
      0,
      296,
      210,
      undefined,
      'NONE',
    );
  });

  it('exports large-sel pages using portrait A4 geometry', async () => {
    const labelCodes = Array.from({ length: 9 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`);
    render(<LabelGenerator labelCodes={labelCodes} layoutMode="large-sel" />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Labels' }));

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith('labels.pdf');
    });

    expect(jsPDFConstructorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 297],
        compress: true,
      }),
    );
    expect(addPageMock).toHaveBeenCalledTimes(1);
  });

  it('shows a user-facing error message if export cannot start', async () => {
    jsPDFConstructorMock.mockImplementationOnce(function mockJsPdfFailure() {
      throw new Error('pdf failed');
    });

    const labelCodes = ['01L01A'];
    render(<LabelGenerator labelCodes={labelCodes} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Labels' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Download failed while preparing the PDF document.');
    });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('shows an error when no print pages are available for export', async () => {
    render(<LabelGenerator labelCodes={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Labels' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No labels are available to export.');
    });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('exposes shared Mini SEL secondary anchor geometry on the preview page style', () => {
    const { container } = render(<LabelGenerator labelCodes={['01L01A']} />);
    const miniTypography = getLabelLayoutStrategy('mini-sel').typography;

    const previewPage = container.querySelector('[class*="previewPage"]');

    expect(previewPage).not.toBeNull();
    expect(previewPage).toHaveStyle({
      '--current-primary-center-from-tile-top-mm': `${miniTypography.primaryCenterFromTileTopMm}mm`,
      '--current-secondary-baseline-from-tile-top-mm': `${miniTypography.secondaryBaselineFromTileTopMm}mm`,
      '--current-secondary-dom-top-offset-mm': `${miniTypography.secondaryDomTopOffsetMm}mm`,
    });
  });

  it('updates preview items through pagination callback', () => {
    const labelCodes = Array.from({ length: 36 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`);
    render(<LabelGenerator labelCodes={labelCodes} />);

    fireEvent.click(screen.getByTestId('pagination-trigger'));

    expect(screen.getByText('MANUAL')).toBeInTheDocument();
  });

  it('invokes window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    render(<LabelGenerator labelCodes={['01L01A']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Print Labels' }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });
});

describe('getDownloadErrorMessage', () => {
  it.each<[LabelPdfExportErrorCode, string]>([
    ['print-pages-missing', 'No labels are available to export.'],
    ['dependency-load-failed', 'Download failed because export libraries could not be loaded.'],
    ['pdf-initialization-failed', 'Download failed while preparing the PDF document.'],
    ['raster-fallback-failed', 'Download failed: both vector export and raster fallback failed.'],
    ['vector-export-failed', 'Download failed while saving the PDF file.'],
  ])('maps %s to a specific user message', (code, expectedMessage) => {
    expect(getDownloadErrorMessage(new LabelPdfExportError(code, 'x'))).toBe(expectedMessage);
  });

  it('maps export-surface initialization errors to an explicit message', () => {
    expect(getDownloadErrorMessage(new Error('Export surface is not ready.'))).toBe(
      'Download failed because the export surface is not ready.',
    );
  });

  it('falls back to default message for unknown errors', () => {
    expect(getDownloadErrorMessage(new Error('unexpected'))).toBe('Download failed. Please try again.');
    expect(getDownloadErrorMessage('unexpected')).toBe('Download failed. Please try again.');
  });
});
