import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { drawRasterPage, drawVectorPage, JsBarcodeFn, JsPdfInstance } from './LabelPdfExport';
import { LabelPdfExportError } from './labelPdfExportError';

interface IExportLabelPdfOptions {
  exportRoot: HTMLDivElement;
  printPageClassName: string;
  pagedItems: string[][];
  layoutStrategy: ILabelLayoutStrategy;
}

export const exportLabelPdf = async ({
  exportRoot,
  printPageClassName,
  pagedItems,
  layoutStrategy,
}: IExportLabelPdfOptions): Promise<void> => {
  let jsPDF: (typeof import('jspdf'))['jsPDF'];
  let jsBarcodeFn: JsBarcodeFn;
  let svg2pdf: (typeof import('svg2pdf.js'))['svg2pdf'];

  try {
    const [jsPdfModule, jsBarcodeModule, svg2pdfModule] = await Promise.all([
      import('jspdf'),
      import('jsbarcode'),
      import('svg2pdf.js'),
    ]);
    jsPDF = jsPdfModule.jsPDF;
    jsBarcodeFn = ('default' in jsBarcodeModule ? jsBarcodeModule.default : jsBarcodeModule) as unknown as JsBarcodeFn;
    svg2pdf = svg2pdfModule.svg2pdf;
  } catch (error: unknown) {
    throw new LabelPdfExportError('dependency-load-failed', 'Unable to load PDF export dependencies.', error);
  }

  const pageElements = Array.from(exportRoot.querySelectorAll(`.${printPageClassName}`));
  if (pageElements.length === 0) {
    throw new LabelPdfExportError('print-pages-missing', 'No print pages available for export.');
  }

  const pageWidthMm = layoutStrategy.page.sheetWidthMm;
  const pageHeightMm = layoutStrategy.page.sheetHeightMm;

  let pdf: JsPdfInstance;
  try {
    pdf = new jsPDF({
      orientation: layoutStrategy.page.orientation,
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: true,
    }) as JsPdfInstance;
  } catch (error: unknown) {
    throw new LabelPdfExportError('pdf-initialization-failed', 'Unable to initialize PDF document.', error);
  }

  for (let index = 0; index < pageElements.length; index += 1) {
    const pageElement = pageElements[index] as HTMLElement;

    if (index > 0) {
      pdf.addPage([pageWidthMm, pageHeightMm], layoutStrategy.page.orientation);
    }

    const pageItems = pagedItems[index] ?? [];

    try {
      await drawVectorPage(pdf, pageItems, layoutStrategy, jsBarcodeFn, svg2pdf);
    } catch (vectorError: unknown) {
      // Fallback preserves download even if SVG vector conversion fails in a browser runtime.
      try {
        await drawRasterPage(pdf, pageElement, pageWidthMm, pageHeightMm);
      } catch (rasterError: unknown) {
        throw new LabelPdfExportError(
          'raster-fallback-failed',
          `Raster fallback failed after vector export error on page ${index + 1}.`,
          { vectorError, rasterError },
        );
      }
    }
  }

  try {
    pdf.save('labels.pdf');
  } catch (error: unknown) {
    throw new LabelPdfExportError('vector-export-failed', 'Unable to save generated PDF.', error);
  }
};
