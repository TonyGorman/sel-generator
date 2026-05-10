import * as React from 'react';
import ReactDOM from 'react-dom';
import styles from './Barcode.module.css';

import { IBarcodeGenerator } from '../models/IBarcodeGenerator';
import Pagination from './Pagination';
import BarcodeTile from './BarcodeTile';
import { PDF_EXPORT_SCALE, PDF_IMAGE_COMPRESSION } from '../config/barcodeConfig';
import { Button } from './FormControls';
import { getDashedCode, getPrimaryText } from './BarcodeTile';

const ITEMS_PER_PAGE = 35;
const GRID_COLUMNS = 7;
const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;

// Keep vector text sizes aligned with CSS text sizes in Barcode.module.css.
const PRIMARY_TEXT_SIZE_MM = 12;
const SECONDARY_TEXT_SIZE_MM = 7;
const PRIMARY_TEXT_LETTER_SPACING_MM = 0.07;

// Calibrated baselines to visually match browser print output.
const PRIMARY_TEXT_BASELINE_FROM_CONTENT_TOP_MM = 11.5;
const SECONDARY_TEXT_BASELINE_FROM_CONTENT_TOP_MM = 22.2;
const BARCODE_MODULE_WIDTH_MM = 0.23;
const BARCODE_HEIGHT_MM = 8;

type JsPdfInstance = {
  addPage: (size: [number, number], orientation: 'landscape') => void;
  rect: (x: number, y: number, width: number, height: number) => void;
  setLineWidth: (width: number) => void;
  setDrawColor: (gray: number) => void;
  setTextColor: (gray: number) => void;
  setFont: (fontName: string, fontStyle: string) => void;
  setFontSize: (size: number) => void;
  setCharSpace: (spacing: number) => void;
  text: (text: string, x: number, y: number, options?: { align?: 'center' | 'left' | 'right' }) => void;
  addImage: (
    imageData: string,
    format: 'PNG',
    x: number,
    y: number,
    width: number,
    height: number,
    alias?: string,
    compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
  ) => void;
  save: (filename: string) => void;
};

type JsBarcodeFn = (
  element: SVGElement,
  value: string,
  options: {
    format: 'CODE128';
    displayValue: boolean;
    width: number;
    height: number;
    margin: number;
  },
) => void;

const readMmCssVariable = (name: string, fallback: number): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mmToPt = (mm: number): number => mm * MM_TO_PT;
const mmToPx = (mm: number): number => mm * MM_TO_PX;

const drawVectorBarcode = async (
  pdf: JsPdfInstance,
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>,
  jsBarcode: JsBarcodeFn,
  barcodeValue: string,
  x: number,
  y: number,
  maxWidth: number,
  height: number,
): Promise<void> => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  jsBarcode(svg, barcodeValue, {
    format: 'CODE128',
    displayValue: false,
    width: mmToPx(BARCODE_MODULE_WIDTH_MM),
    height: mmToPx(BARCODE_HEIGHT_MM),
    margin: 0,
  });

  // Preserve barcode aspect ratio so modules are not stretched wider than print output.
  const viewBox = svg.viewBox.baseVal;
  const sourceWidth = viewBox && viewBox.width > 0 ? viewBox.width : svg.getBoundingClientRect().width;
  const sourceHeight = viewBox && viewBox.height > 0 ? viewBox.height : svg.getBoundingClientRect().height;
  const aspectRatio = sourceWidth > 0 && sourceHeight > 0 ? sourceWidth / sourceHeight : 1;

  const targetWidth = Math.min(maxWidth, height * aspectRatio);
  const centeredX = x + (maxWidth - targetWidth) / 2;

  await svg2pdf(svg, pdf, { x: centeredX, y, width: targetWidth, height });
};

const drawVectorPage = async (
  pdf: JsPdfInstance,
  pageItems: string[],
  type: string | undefined,
  config: IBarcodeGenerator['config'],
  jsBarcode: JsBarcodeFn,
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>,
): Promise<void> => {
  const tileSizeMm = readMmCssVariable('--tile-size-mm', 39);
  const pagePadLeftMm = readMmCssVariable('--page-pad-left-mm', 11);
  const pagePadTopMm = readMmCssVariable('--page-pad-top-mm', 7.5);
  const tilePaddingHorizontalMm = 1.2;
  const tilePaddingTopMm = 1.5;
  const tilePaddingBottomMm = 0.8;
  const barcodeHeightMm = 8;
  const barcodeBottomMarginMm = 4;

  pdf.setLineWidth(0.2);
  pdf.setDrawColor(140);
  pdf.setTextColor(0);

  for (let index = 0; index < pageItems.length; index += 1) {
    const code = pageItems[index];
    const row = Math.floor(index / GRID_COLUMNS);
    const column = index % GRID_COLUMNS;

    const x = pagePadLeftMm + column * tileSizeMm;
    const y = pagePadTopMm + row * tileSizeMm;

    const { primary, secondary } = getPrimaryText(
      code,
      config.primaryCodeFormat,
      config.shelfStyle,
      config.secondaryCodeFormat,
      type,
      config.backCodePrefix,
    );

    pdf.rect(x, y, tileSizeMm, tileSizeMm);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(mmToPt(PRIMARY_TEXT_SIZE_MM));
    pdf.setCharSpace(PRIMARY_TEXT_LETTER_SPACING_MM);
    pdf.text(primary, x + tileSizeMm / 2, y + tilePaddingTopMm + PRIMARY_TEXT_BASELINE_FROM_CONTENT_TOP_MM, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(mmToPt(SECONDARY_TEXT_SIZE_MM));
    pdf.setCharSpace(0);
    pdf.text(secondary, x + tileSizeMm / 2, y + tilePaddingTopMm + SECONDARY_TEXT_BASELINE_FROM_CONTENT_TOP_MM, { align: 'center' });

    const barcodeX = x + tilePaddingHorizontalMm;
    const barcodeY = y + tileSizeMm - tilePaddingBottomMm - barcodeBottomMarginMm - barcodeHeightMm;
    const barcodeWidth = tileSizeMm - tilePaddingHorizontalMm * 2;
    await drawVectorBarcode(
      pdf,
      svg2pdf,
      jsBarcode,
      getDashedCode(code, type, config.backCodePrefix),
      barcodeX,
      barcodeY,
      barcodeWidth,
      barcodeHeightMm,
    );
  }
};

const drawRasterPage = async (
  pdf: JsPdfInstance,
  pageElement: HTMLElement,
  pageWidthMm: number,
  pageHeightMm: number,
): Promise<void> => {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(pageElement, {
    scale: PDF_EXPORT_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  const imageData = canvas.toDataURL('image/png');
  pdf.addImage(imageData, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, PDF_IMAGE_COMPRESSION);
};

const BarcodeGenerator = (props: IBarcodeGenerator): React.ReactElement => {
  const { aisles, type, config } = props;
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<string[]>(aisles);
  const [printContainer, setPrintContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const id = 'barcode-print-surface';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    setPrintContainer(el);
    return () => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);
  const pagedItems = React.useMemo(() => {
    const pages: string[][] = [];

    for (let index = 0; index < aisles.length; index += ITEMS_PER_PAGE) {
      pages.push(aisles.slice(index, index + ITEMS_PER_PAGE));
    }

    return pages;
  }, [aisles]);

  React.useEffect(() => {
    setItems(aisles.slice(0, ITEMS_PER_PAGE));
  }, [aisles]);

  const handleGeneratePdf = async (): Promise<void> => {
    setDownloadError(null);
    setLoading(true);

    try {
      const [{ jsPDF }, { default: JsBarcode }, { svg2pdf }] = await Promise.all([
        import('jspdf'),
        import('jsbarcode'),
        import('svg2pdf.js'),
      ]);

      const exportRoot = pdfRef.current;
      if (!exportRoot) {
        throw new Error('Export surface is not ready.');
      }

      const pageElements = Array.from(exportRoot.querySelectorAll(`.${styles.printPage}`));
      if (pageElements.length === 0) {
        throw new Error('No print pages available for export.');
      }

      // Keep PDF dimensions in sync with print CSS custom properties.
      const pageWidthMm = readMmCssVariable('--sheet-width-mm', 296);
      const pageHeightMm = readMmCssVariable('--sheet-height-mm', 210);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pageWidthMm, pageHeightMm],
        compress: true,
      }) as JsPdfInstance;

      for (let index = 0; index < pageElements.length; index += 1) {
        const pageElement = pageElements[index] as HTMLElement;

        if (index > 0) {
          pdf.addPage([pageWidthMm, pageHeightMm], 'landscape');
        }

        const pageItems = pagedItems[index] ?? [];

        try {
          await drawVectorPage(pdf, pageItems, type, config, JsBarcode as unknown as JsBarcodeFn, svg2pdf);
        } catch {
          // Fallback preserves download even if SVG vector conversion fails in a browser runtime.
          await drawRasterPage(pdf, pageElement, pageWidthMm, pageHeightMm);
        }
      }

      pdf.save('barcodes.pdf');
    } catch {
      setDownloadError('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (currentItems: string[]): void => {
    setItems(currentItems)
  }

  const handlePrint = (): void => {
    window.print();
  }

  const renderBarcodeGrid = (barcodes: string[], className?: string): React.ReactElement => (
    <div className={className ?? styles.barcodeDiv}>
      {barcodes.map((aisle: string, index: number) => {
        return (
          <BarcodeTile key={`${aisle}-${index}`} code={aisle} config={config} type={type} />
        );
      })}
    </div>
  );


  return (
    <>

      {loading && (
        <div className={styles.loaderBox} role="status" aria-live="polite" aria-atomic="true">
          Downloading barcode PDF using barcode-safe export profile....
        </div>
      )}
      {!loading && (
        <div className={styles.actionBar}>
          <Button className={styles.actionButton} onClick={handlePrint}>Print Barcodes</Button>
          <Button className={styles.actionButton} onClick={handleGeneratePdf}>Download Barcodes</Button>
        </div>
      )}
      {downloadError && (
        <div role="alert" aria-live="assertive" aria-atomic="true" className={styles.alertError}>
          <div><span>{downloadError}</span></div>
        </div>
      )}
      {/* PDF export surface — hidden off-screen, used for fallback raster capture. */}
      <div className={styles.exportSurface} ref={pdfRef} aria-hidden="true">
        {pagedItems.map((pageItems, pageIndex) => (
          <div key={`page-${pageIndex + 1}`} className={styles.printPage}>
            {renderBarcodeGrid(pageItems, styles.printBarcodeDiv)}
          </div>
        ))}
      </div>
      {/* Print portal — renders at <body> level so print CSS can isolate it cleanly.
           Hidden off-screen on screen, shown only during print. */}
      {printContainer && ReactDOM.createPortal(
        <div className={styles.printPortal}>
          {pagedItems.map((pageItems, pageIndex) => (
            <div key={`page-${pageIndex + 1}`} className={styles.printPage}>
              {renderBarcodeGrid(pageItems, styles.printBarcodeDiv)}
            </div>
          ))}
        </div>,
        printContainer
      )}
      <div className={styles.pdfDiv}>
        <div className={styles.previewPage}>
          {renderBarcodeGrid(items)}
        </div>
      </div>
      {aisles.length > ITEMS_PER_PAGE && <Pagination data={aisles} onPageChange={handlePageChange} />}
    </>
  );
};

export default BarcodeGenerator;
