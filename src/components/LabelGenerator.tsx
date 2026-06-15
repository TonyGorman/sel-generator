import * as React from 'react';
import ReactDOM from 'react-dom';
import styles from './LabelApp.module.css';
import alertStyles from './Alert.module.css';

import { ILabelGenerator } from '../models/ILabelGenerator';
import Pagination from './Pagination';
import LabelTile from './LabelTile';
import { Button } from './FormControls';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { drawVectorPage, drawRasterPage, type JsPdfInstance, type JsBarcodeFn } from './LabelPdfExport';
import { buildLayoutCssVars } from './labelLayoutCssVars';

const getItemsPerPage = (layoutStrategy: ILabelLayoutStrategy): number => {
  return layoutStrategy.page.columns * layoutStrategy.page.rows;
};

const LabelGenerator = (props: ILabelGenerator): React.ReactElement => {
  const { labelCodes, layoutMode = DEFAULT_LABEL_PRINT_MODE } = props;
  const layoutStrategy = React.useMemo(() => getLabelLayoutStrategy(layoutMode), [layoutMode]);
  const itemsPerPage = React.useMemo(() => getItemsPerPage(layoutStrategy), [layoutStrategy]);
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<string[]>(() => labelCodes.slice(0, itemsPerPage));
  const [printContainer, setPrintContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const id = 'label-print-surface';
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

    for (let index = 0; index < labelCodes.length; index += itemsPerPage) {
      pages.push(labelCodes.slice(index, index + itemsPerPage));
    }

    return pages;
  }, [labelCodes, itemsPerPage]);

  React.useEffect(() => {
    setItems(labelCodes.slice(0, itemsPerPage));
  }, [labelCodes, itemsPerPage]);

  const handleGeneratePdf = React.useCallback(async (): Promise<void> => {
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
            await drawVectorPage(pdf, pageItems, layoutStrategy, JsBarcode as unknown as JsBarcodeFn, svg2pdf);
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
  }, [layoutStrategy, pagedItems]);

  const handlePageChange = React.useCallback((currentItems: string[]): void => {
    setItems(currentItems);
  }, []);

  const handlePrint = React.useCallback((): void => {
    window.print();
  }, []);

  const pageStyle = React.useMemo(
    () => buildLayoutCssVars(layoutStrategy),
    [layoutStrategy],
  );

  const renderLabelGrid = React.useCallback(
    (labels: string[], className?: string): React.ReactElement => (
      <div className={className ?? styles.labelDiv}>
        {labels.map((labelCode: string, index: number) => {
          return (
            <LabelTile key={`${labelCode}-${index}`} code={labelCode} layoutMode={layoutStrategy.mode} />
          );
        })}
      </div>
    ),
    [layoutStrategy.mode],
  );


  return (
    <>
      <style media="print">{`@page { size: A4 ${layoutStrategy.page.orientation}; margin: 0; }`}</style>

      {loading && (
        <div className={styles.loaderBox} role="status" aria-live="polite" aria-atomic="true">
          Downloading label PDF using label-safe export profile....
        </div>
      )}
      {!loading && (
        <div className={styles.actionBar}>
          <Button className={styles.actionButton} onClick={handlePrint}>Print Labels</Button>
          <Button className={styles.actionButton} onClick={handleGeneratePdf}>Download Labels</Button>
        </div>
      )}
      {downloadError && (
        <div role="alert" aria-live="assertive" aria-atomic="true" className={alertStyles.alertError}>
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
      {labelCodes.length > itemsPerPage && <Pagination data={labelCodes} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />}
    </>
  );
};

export default LabelGenerator;
