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
import { buildLayoutCssVars } from './labelLayoutCssVars';
import { usePaginatedLabels } from './usePaginatedLabels';
import { usePrintPortal } from './usePrintPortal';
import { exportLabelPdf } from './labelPdfExporter';
import { LabelPdfExportError } from './labelPdfExportError';

const getItemsPerPage = (layoutStrategy: ILabelLayoutStrategy): number => {
  return layoutStrategy.page.columns * layoutStrategy.page.rows;
};

export const getDownloadErrorMessage = (error: unknown): string => {
  if (error instanceof LabelPdfExportError) {
    switch (error.code) {
      case 'print-pages-missing':
        return 'No labels are available to export.';
      case 'dependency-load-failed':
        return 'Download failed because export libraries could not be loaded.';
      case 'pdf-initialization-failed':
        return 'Download failed while preparing the PDF document.';
      case 'raster-fallback-failed':
        return 'Download failed: both vector export and raster fallback failed.';
      case 'vector-export-failed':
        return 'Download failed while saving the PDF file.';
      default:
        return 'Download failed. Please try again.';
    }
  }

  if (error instanceof Error && error.message === 'Export surface is not ready.') {
    return 'Download failed because the export surface is not ready.';
  }

  return 'Download failed. Please try again.';
};

const LabelGenerator = (props: ILabelGenerator): React.ReactElement => {
  const { labelCodes, layoutMode = DEFAULT_LABEL_PRINT_MODE } = props;
  const layoutStrategy = React.useMemo(() => getLabelLayoutStrategy(layoutMode), [layoutMode]);
  const itemsPerPage = React.useMemo(() => getItemsPerPage(layoutStrategy), [layoutStrategy]);
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const printContainer = usePrintPortal();
  const { pagedItems, previewItems, handlePageChange } = usePaginatedLabels(labelCodes, itemsPerPage);

  const handleGeneratePdf = React.useCallback(async (): Promise<void> => {
    setDownloadError(null);
    setLoading(true);

    try {
      const exportRoot = pdfRef.current;
      if (!exportRoot) {
        throw new Error('Export surface is not ready.');
      }

      await exportLabelPdf({
        exportRoot,
        printPageClassName: styles.printPage,
        pagedItems,
        layoutStrategy,
      });
    } catch (error: unknown) {
      setDownloadError(getDownloadErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [layoutStrategy, pagedItems]);

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
          {renderLabelGrid(previewItems)}
        </div>
      </div>
      {labelCodes.length > itemsPerPage && <Pagination data={labelCodes} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />}
    </>
  );
};

export default LabelGenerator;
