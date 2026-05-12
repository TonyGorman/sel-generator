import * as React from 'react';
import ReactDOM from 'react-dom';
import styles from './LabelApp.module.css';

import { ILabelGenerator } from '../models/ILabelGenerator';
import Pagination from './Pagination';
import LabelTile from './LabelTile';
import { Button } from './FormControls';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { getBarcodeCssVarsForMode } from '../config/barcodeCssVars';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { drawVectorPage, drawRasterPage, type JsPdfInstance, type JsBarcodeFn } from './LabelPdfExport';

const getItemsPerPage = (layoutStrategy: ILabelLayoutStrategy): number => {
  return layoutStrategy.page.columns * layoutStrategy.page.rows;
};

const toMmStyle = (value: number): string => `${value}mm`;

const LabelGenerator = (props: ILabelGenerator): React.ReactElement => {
  const { aisles, type, config, layoutMode = DEFAULT_LABEL_PRINT_MODE } = props;
  const layoutStrategy = React.useMemo(() => getLabelLayoutStrategy(layoutMode), [layoutMode]);
  const itemsPerPage = React.useMemo(() => getItemsPerPage(layoutStrategy), [layoutStrategy]);
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<string[]>(aisles.slice(0, itemsPerPage));
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

    for (let index = 0; index < aisles.length; index += itemsPerPage) {
      pages.push(aisles.slice(index, index + itemsPerPage));
    }

    return pages;
  }, [aisles, itemsPerPage]);

  React.useEffect(() => {
    setItems(aisles.slice(0, itemsPerPage));
  }, [aisles, itemsPerPage]);

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

      const pageWidthMm = layoutStrategy.page.sheetWidthMm;
      const pageHeightMm = layoutStrategy.page.sheetHeightMm;

      const pdf = new jsPDF({
        orientation: layoutStrategy.page.orientation,
        unit: 'mm',
        format: [pageWidthMm, pageHeightMm],
        compress: true,
      }) as JsPdfInstance;

      for (let index = 0; index < pageElements.length; index += 1) {
        const pageElement = pageElements[index] as HTMLElement;

        if (index > 0) {
          pdf.addPage([pageWidthMm, pageHeightMm], layoutStrategy.page.orientation);
        }

        const pageItems = pagedItems[index] ?? [];

        try {
          await drawVectorPage(pdf, pageItems, type, config, layoutStrategy, JsBarcode as unknown as JsBarcodeFn, svg2pdf);
        } catch {
          // Fallback preserves download even if SVG vector conversion fails in a browser runtime.
          await drawRasterPage(pdf, pageElement, pageWidthMm, pageHeightMm);
        }
      }

      pdf.save('labels.pdf');
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

  const pageStyle = React.useMemo(
    () => {
      const geometry = layoutStrategy.barcodeGeometry;
      const page = layoutStrategy.page;
      const typography = layoutStrategy.typography;
      const modeVars = getBarcodeCssVarsForMode(layoutStrategy.mode, geometry);

      const pageVars: Record<string, string> = {
        '--current-sheet-width-mm': toMmStyle(page.sheetWidthMm),
        '--current-sheet-height-mm': toMmStyle(page.sheetHeightMm),
        '--current-page-pad-top-mm': toMmStyle(page.pagePadTopMm),
        '--current-page-pad-right-mm': toMmStyle(page.pagePadRightMm),
        '--current-page-pad-bottom-mm': toMmStyle(page.pagePadBottomMm),
        '--current-page-pad-left-mm': toMmStyle(page.pagePadLeftMm),
        '--current-grid-columns': String(page.columns),
        '--current-label-width-mm': toMmStyle(page.labelWidthMm),
        '--current-label-height-mm': toMmStyle(page.labelHeightMm),
        '--current-grid-height-mm': toMmStyle(page.labelHeightMm * page.rows),
        '--current-tile-width-mm': toMmStyle(page.labelWidthMm),
        '--current-tile-height-mm': toMmStyle(page.labelHeightMm),
        '--current-tile-pad-top-mm': toMmStyle(typography.tilePaddingTopMm),
        '--current-tile-pad-horizontal-mm': toMmStyle(typography.tilePaddingHorizontalMm),
        '--current-tile-pad-bottom-mm': toMmStyle(typography.tilePaddingBottomMm),
        '--current-large-prefix-text-size-mm': toMmStyle(typography.largePrefixTextSizeMm),
        '--current-large-main-text-size-mm': toMmStyle(typography.largeMainTextSizeMm),
        '--current-large-suffix-text-size-mm': toMmStyle(typography.largeSuffixTextSizeMm),
      };

      return {
        ...pageVars,
        ...modeVars,
      } as React.CSSProperties;
    },
    [layoutStrategy],
  );

  const renderLabelGrid = (labels: string[], className?: string): React.ReactElement => (
    <div className={className ?? styles.labelDiv}>
      {labels.map((aisle: string, index: number) => {
        return (
          <LabelTile key={`${aisle}-${index}`} code={aisle} config={config} type={type} layoutMode={layoutStrategy.mode} />
        );
      })}
    </div>
  );


  return (
    <>
      <style media="print">{`@page { size: A4 ${layoutStrategy.page.orientation}; margin: 0; }`}</style>

      {loading && (
        <div className={styles.loaderBox} role="status" aria-live="polite" aria-atomic="true">
          Downloading label PDF using barcode-safe export profile....
        </div>
      )}
      {!loading && (
        <div className={styles.actionBar}>
          <Button className={styles.actionButton} onClick={handlePrint}>Print Labels</Button>
          <Button className={styles.actionButton} onClick={handleGeneratePdf}>Download Labels</Button>
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
          <div key={`page-${pageIndex + 1}`} className={styles.printPage} style={pageStyle}>
            {renderLabelGrid(pageItems, styles.printLabelDiv)}
          </div>
        ))}
      </div>
      {/* Print portal — renders at <body> level so print CSS can isolate it cleanly.
           Hidden off-screen on screen, shown only during print. */}
      {printContainer && ReactDOM.createPortal(
        <div className={styles.printPortal}>
          {pagedItems.map((pageItems, pageIndex) => (
            <div key={`page-${pageIndex + 1}`} className={styles.printPage} style={pageStyle}>
              {renderLabelGrid(pageItems, styles.printLabelDiv)}
            </div>
          ))}
        </div>,
        printContainer
      )}
      <div className={styles.pdfDiv}>
        <div className={styles.previewPage} style={pageStyle}>
          {renderLabelGrid(items)}
        </div>
      </div>
      {aisles.length > itemsPerPage && <Pagination data={aisles} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />}
    </>
  );
};

export default LabelGenerator;
