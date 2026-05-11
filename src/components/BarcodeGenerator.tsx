import * as React from 'react';
import ReactDOM from 'react-dom';
import styles from './Barcode.module.css';

import { IBarcodeGenerator } from '../models/IBarcodeGenerator';
import Pagination from './Pagination';
import LabelTile from './LabelTile';
import { Button } from './FormControls';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { drawVectorPage, drawRasterPage, type JsPdfInstance, type JsBarcodeFn } from './labelPdfExport';

const getItemsPerPage = (layoutStrategy: ILabelLayoutStrategy): number => {
  return layoutStrategy.page.columns * layoutStrategy.page.rows;
};

const toMmStyle = (value: number): string => `${value}mm`;

const BarcodeGenerator = (props: IBarcodeGenerator): React.ReactElement => {
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

  const pageStyle = React.useMemo(
    () => ({
      width: toMmStyle(layoutStrategy.page.sheetWidthMm),
      height: toMmStyle(layoutStrategy.page.sheetHeightMm),
      paddingTop: toMmStyle(layoutStrategy.page.pagePadTopMm),
      paddingRight: toMmStyle(layoutStrategy.page.pagePadRightMm),
      paddingBottom: toMmStyle(layoutStrategy.page.pagePadBottomMm),
      paddingLeft: toMmStyle(layoutStrategy.page.pagePadLeftMm),
    }),
    [layoutStrategy],
  );

  const gridStyle = React.useMemo(
    () => ({
      gridTemplateColumns: `repeat(${layoutStrategy.page.columns}, ${toMmStyle(layoutStrategy.page.labelWidthMm)})`,
      gridAutoRows: toMmStyle(layoutStrategy.page.labelHeightMm),
      height: toMmStyle(layoutStrategy.page.labelHeightMm * layoutStrategy.page.rows),
    }),
    [layoutStrategy],
  );

  const renderLabelGrid = (barcodes: string[], className?: string): React.ReactElement => (
    <div className={className ?? styles.barcodeDiv} style={gridStyle}>
      {barcodes.map((aisle: string, index: number) => {
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
          <div key={`page-${pageIndex + 1}`} className={styles.printPage} style={pageStyle}>
            {renderLabelGrid(pageItems, styles.printBarcodeDiv)}
          </div>
        ))}
      </div>
      {/* Print portal — renders at <body> level so print CSS can isolate it cleanly.
           Hidden off-screen on screen, shown only during print. */}
      {printContainer && ReactDOM.createPortal(
        <div className={styles.printPortal}>
          {pagedItems.map((pageItems, pageIndex) => (
            <div key={`page-${pageIndex + 1}`} className={styles.printPage} style={pageStyle}>
              {renderLabelGrid(pageItems, styles.printBarcodeDiv)}
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

export default BarcodeGenerator;
