import * as React from 'react';
import ReactDOM from 'react-dom';
import styles from './LabelApp.module.css';

import { ILabelGenerator } from '../models/ILabelGenerator';
import Pagination from './Pagination';
import LabelTile from './LabelTile';
import { Button } from './FormControls';
import controlStyles from './FormControls.module.css';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { buildLayoutCssVars } from './labelLayoutCssVars';
import { usePaginatedLabels } from './usePaginatedLabels';
import { usePrintPortal } from './usePrintPortal';
import { resolveConfiguredMiniVariantId } from '../domain/miniVariantPreference';
import { resolveMiniCompositionVariantId } from '../domain/labelCodeDomain';

const getItemsPerPage = (layoutStrategy: ILabelLayoutStrategy): number => {
  return layoutStrategy.page.columns * layoutStrategy.page.rows;
};

const LabelGenerator = (props: ILabelGenerator): React.ReactElement => {
  const { labelCodes, layoutMode = DEFAULT_LABEL_PRINT_MODE } = props;
  const layoutStrategy = React.useMemo(() => getLabelLayoutStrategy(layoutMode), [layoutMode]);
  const itemsPerPage = React.useMemo(() => getItemsPerPage(layoutStrategy), [layoutStrategy]);
  const printContainer = usePrintPortal();
  const { pagedItems, previewItems, handlePageChange } = usePaginatedLabels(labelCodes, itemsPerPage);

  const handlePrint = React.useCallback((): void => {
    window.print();
  }, []);

  const pageStyle = React.useMemo(
    () => buildLayoutCssVars(layoutStrategy),
    [layoutStrategy],
  );
  const miniVariantId = resolveMiniCompositionVariantId(layoutStrategy.mode, resolveConfiguredMiniVariantId());

  const renderLabelGrid = React.useCallback(
    (labels: string[], className?: string): React.ReactElement => (
      <div className={className ?? styles.labelDiv}>
        {labels.map((labelCode: string, index: number) => {
          return (
            <LabelTile
              key={`${labelCode}-${index}`}
              code={labelCode}
              layoutMode={layoutStrategy.mode}
              miniVariantId={miniVariantId}
            />
          );
        })}
      </div>
    ),
    [layoutStrategy.mode, miniVariantId],
  );


  return (
    <>
      <style media="print">{`@page { size: A4 ${layoutStrategy.page.orientation}; margin: 0; }`}</style>

      <div className={styles.actionBar}>
        <Button aria-label="Print Labels" className={styles.actionButton} onClick={handlePrint}>
          <span className={controlStyles.buttonLabel}>Print Labels</span>
          <span className={controlStyles.buttonIcon} aria-hidden="true">🖨️</span>
        </Button>
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
