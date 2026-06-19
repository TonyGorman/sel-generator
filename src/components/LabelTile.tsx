import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './LabelApp.module.css';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy, LabelPrintMode } from '../models/ILabelLayoutStrategy';
import {
  getEncodedLabelCode,
  getLargeSelDisplayParts,
  getMiniThreeRowDisplayParts,
  getPrimaryLabelText,
} from '../domain/labelCodeDomain';
import {
  estimatePrimaryTextWidthMm,
  fitMiniPrimaryFontSizeMm,
  getMiniAisleThreeRowGeometry,
} from './labelLayoutGeometry';

const MM_TO_PX = 96 / 25.4;
const PRIMARY_TEXT_FONT_WEIGHT = 800;
const PRIMARY_TEXT_FONT_FAMILY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

let primaryTextMeasureContext: CanvasRenderingContext2D | null | undefined;

const mmToPx = (mm: number): number => mm * MM_TO_PX;

const getPrimaryTextMeasureContext = (): CanvasRenderingContext2D | null => {
  if (primaryTextMeasureContext !== undefined) {
    return primaryTextMeasureContext;
  }

  if (typeof document === 'undefined') {
    primaryTextMeasureContext = null;
    return primaryTextMeasureContext;
  }

  const canvas = document.createElement('canvas');
  primaryTextMeasureContext = canvas.getContext('2d');
  return primaryTextMeasureContext;
};

const measurePrimaryTextWidthMm = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
  if (!text) {
    return 0;
  }

  const context = getPrimaryTextMeasureContext();
  if (!context) {
    return estimatePrimaryTextWidthMm(text, fontSizeMm, letterSpacingMm);
  }

  context.font = `${PRIMARY_TEXT_FONT_WEIGHT} ${mmToPx(fontSizeMm)}px ${PRIMARY_TEXT_FONT_FAMILY}`;
  const glyphWidthMm = context.measureText(text).width / MM_TO_PX;
  const spacingWidthMm = Math.max(text.length - 1, 0) * letterSpacingMm;

  return glyphWidthMm + spacingWidthMm;
};

export const getMiniPrimaryFontSizeMm = (primaryText: string, layoutStrategy: ILabelLayoutStrategy): number => {
  return fitMiniPrimaryFontSizeMm(primaryText, layoutStrategy, measurePrimaryTextWidthMm);
};
export {
  normalizeLabelCode,
  getEncodedLabelCode,
  getPrimaryLabelText,
  getLargeSelDisplayParts,
} from '../domain/labelCodeDomain';

interface ILabelTileProps {
  code: string;
  shortCodePrefix?: string;
  layoutMode?: LabelPrintMode;
}

interface IMiniSelTileContentProps {
  primary: string;
  primaryFontSizeMm: number;
  primaryFontWeight?: number;
  primaryCenterFromContentTopMm: number;
}

const MiniSelTileContent: React.FC<IMiniSelTileContentProps> = ({
  primary,
  primaryFontSizeMm,
  primaryFontWeight,
  primaryCenterFromContentTopMm,
}) => {
  const primaryCodeStyle = {
    '--current-mini-primary-text-size-mm': `${primaryFontSizeMm}mm`,
    '--current-mini-primary-font-weight': String(primaryFontWeight ?? 800),
    '--current-mini-primary-center-from-content-top-mm': `${primaryCenterFromContentTopMm}mm`,
  } as React.CSSProperties;

  return (
    <div className={styles.primaryCode} style={primaryCodeStyle}>{primary}</div>
  );
};

interface ILargeSelTileContentProps {
  code: string;
  primary: string;
  secondary: string;
  shortCodePrefix?: string;
}

const LargeSelTileContent: React.FC<ILargeSelTileContentProps> = ({
  code,
  primary,
  secondary,
  shortCodePrefix,
}) => {
  const largeDisplayParts = getLargeSelDisplayParts(code, shortCodePrefix);
  const fallbackHeadingText = secondary || primary;

  return (
    <div className={styles.largeSelHeading}>
      {largeDisplayParts ? (
        <>
          <span className={styles.largeSelHeadingPrefix}>{largeDisplayParts.prefix}</span>
          <span className={styles.largeSelHeadingMain}>{largeDisplayParts.main}</span>
          <span className={styles.largeSelHeadingSuffix}>{largeDisplayParts.suffix}</span>
        </>
      ) : (
        <span className={styles.largeSelHeadingFallback}>{fallbackHeadingText}</span>
      )}
    </div>
  );
};

const LabelTile: React.FC<ILabelTileProps> = ({
  code,
  shortCodePrefix,
  layoutMode = DEFAULT_LABEL_PRINT_MODE,
}) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode);
  const { primary, secondary } = getPrimaryLabelText(code, shortCodePrefix);
  const labelValue = getEncodedLabelCode(code, shortCodePrefix);
  const isLargeSel = layoutMode === 'large-sel';
  const miniThreeRowDisplayParts = getMiniThreeRowDisplayParts(code, shortCodePrefix);
  const miniAisleGeometry = getMiniAisleThreeRowGeometry(layoutStrategy);
  const miniPrimaryText = miniThreeRowDisplayParts.main;
  const primaryFontSizeMm = isLargeSel
    ? getMiniPrimaryFontSizeMm(primary, layoutStrategy)
    : Math.min(getMiniPrimaryFontSizeMm(miniPrimaryText, layoutStrategy), miniAisleGeometry.mainMaxTextSizeMm);
  const primaryCenterFromContentTopMm = miniAisleGeometry.mainCenterFromContentTopMm;

  return (
    <div className={isLargeSel ? styles.labelBoxLargeSel : styles.labelBox}>
      <div className={isLargeSel ? styles.largeSelLabelTextArea : styles.labelText}>
        {isLargeSel ? (
          <LargeSelTileContent
            code={code}
            primary={primary}
            secondary={secondary}
            shortCodePrefix={shortCodePrefix}
          />
        ) : (
          <>
            <div
              className={styles.miniAisleTopCode}
              style={{
                '--current-mini-aisle-top-center-from-content-top-mm': `${miniAisleGeometry.topCenterFromContentTopMm}mm`,
                '--current-mini-aisle-aux-text-size-mm': `${miniAisleGeometry.auxTextSizeMm}mm`,
              } as React.CSSProperties}
            >
              {miniThreeRowDisplayParts.top}
            </div>
            <MiniSelTileContent
              primary={miniThreeRowDisplayParts.main}
              primaryFontSizeMm={primaryFontSizeMm}
              primaryFontWeight={900}
              primaryCenterFromContentTopMm={primaryCenterFromContentTopMm}
            />
            <div
              className={styles.miniAisleBottomCode}
              style={{
                '--current-mini-aisle-bottom-center-from-content-top-mm': `${miniAisleGeometry.bottomCenterFromContentTopMm}mm`,
                '--current-mini-aisle-aux-text-size-mm': `${miniAisleGeometry.auxTextSizeMm}mm`,
              } as React.CSSProperties}
            >
              {miniThreeRowDisplayParts.bottom}
            </div>
          </>
        )}
      </div>
      <div className={isLargeSel ? styles.barcodeGraphicLargeSel : styles.barcodeGraphic}>
        <Barcode
          value={labelValue}
          format="CODE128B"
          displayValue={false}
          width={mmToPx(layoutStrategy.typography.barcodeModuleThicknessMm)}
          height={mmToPx(layoutStrategy.typography.barcodeHeightMm)}
          margin={0}
        />
        <div className={isLargeSel ? styles.encodedValueLargeSel : styles.encodedValue}>{labelValue}</div>
      </div>
    </div>
  );
};

export default LabelTile;
