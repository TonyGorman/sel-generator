import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BarcodeGenerator from './BarcodeGenerator';
import { IBarcodeConfig } from '../models/IBarcodeConfig';

const {
  addPageMock,
  rectMock,
  setLineWidthMock,
  setDrawColorMock,
  setTextColorMock,
  setFontMock,
  setFontSizeMock,
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

vi.mock('./BarcodeTile', () => ({
  default: ({ code }: { code: string }) => <div>{code}</div>,
  getDashedCode: (code: string) => code,
  getPrimaryText: (code: string) => ({ primary: code, secondary: code }),
}));

vi.mock('./Pagination', () => ({
  default: () => <div data-testid="pagination" />,
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
};

describe('BarcodeGenerator PDF export', () => {
  beforeEach(() => {
    addPageMock.mockReset();
    rectMock.mockReset();
    setLineWidthMock.mockReset();
    setDrawColorMock.mockReset();
    setTextColorMock.mockReset();
    setFontMock.mockReset();
    setFontSizeMock.mockReset();
    textMock.mockReset();
    addImageMock.mockReset();
    saveMock.mockReset();
    jsPDFConstructorMock.mockClear();
    jsBarcodeMock.mockClear();
    svg2pdfMock.mockClear();
    toDataUrlMock.mockClear();
    html2CanvasMock.mockClear();
  });

  it('exports all pages with vector barcode rendering in one landscape A4 PDF', async () => {
    const aisles = Array.from({ length: 40 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`);
    render(<BarcodeGenerator type="Aisle" aisles={aisles} config={defaultConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Barcodes' }));

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith('barcodes.pdf');
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

    const aisles = ['01L01A'];
    render(<BarcodeGenerator type="Aisle" aisles={aisles} config={defaultConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Barcodes' }));

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith('barcodes.pdf');
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

  it('shows a user-facing error message if export cannot start', async () => {
    jsPDFConstructorMock.mockImplementationOnce(function mockJsPdfFailure() {
      throw new Error('pdf failed');
    });

    const aisles = ['01L01A'];
    render(<BarcodeGenerator type="Aisle" aisles={aisles} config={defaultConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Download Barcodes' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Download failed. Please try again.');
    });
    expect(saveMock).not.toHaveBeenCalled();
  });
});
