import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './LabelApp.module.css';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy, LabelPrintMode } from '../models/ILabelLayoutStrategy';
import {
  getEncodedLabelCode,
  getLargeSelDisplayParts,
  getPrimaryLabelText,
} from '../domain/labelCodeDomain';
import {
  estimatePrimaryTextWidthMm,
  fitMiniPrimaryFontSizeMm,
  getMiniPrimaryCenterFromContentTopMm,
  getMiniSecondaryTopFromContentTopMm,
} from './labelLayoutGeometry';

const MM_TO_PX = 96 / 25.4;
const MINI_LABEL_HEIGHT_MM = 8;
const LARGE_LABEL_HEIGHT_MM = 10;
const LABEL_MODULE_WIDTH_MM = 0.23;
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
  config: ILabelConfig;
  layoutMode?: LabelPrintMode;
}

interface IMiniSelTileContentProps {
  primary: string;
  secondary: string;
  primaryFontSizeMm: number;
  primaryCenterFromContentTopMm: number;
  secondaryTopFromContentTopMm: number;
}

const MiniSelTileContent: React.FC<IMiniSelTileContentProps> = ({
  primary,
  secondary,
  primaryFontSizeMm,
  primaryCenterFromContentTopMm,
  secondaryTopFromContentTopMm,
}) => {
  const primaryCodeStyle = {
    '--current-mini-primary-text-size-mm': `${primaryFontSizeMm}mm`,
    '--current-mini-primary-center-from-content-top-mm': `${primaryCenterFromContentTopMm}mm`,
  } as React.CSSProperties;
  const secondaryCodeStyle = {
    '--current-mini-secondary-top-from-content-top-mm': `${secondaryTopFromContentTopMm}mm`,
  } as React.CSSProperties;

  return (
    <>
      <div className={styles.primaryCode} style={primaryCodeStyle}>{primary}</div>
      <div className={styles.secondaryCode} style={secondaryCodeStyle}>{secondary}</div>
    </>
  );
};

interface ILargeSelTileContentProps {
  code: string;
  secondary: string;
  backCodePrefix: string;
  specialAisleValues?: readonly string[];
}

const LargeSelTileContent: React.FC<ILargeSelTileContentProps> = ({
  code,
  secondary,
  backCodePrefix,
  specialAisleValues,
}) => {
  const largeDisplayParts = getLargeSelDisplayParts(code, backCodePrefix, specialAisleValues);

  return (
    <div className={styles.largeSelHeading}>
      {largeDisplayParts ? (
        <>
          <span className={styles.largeSelHeadingPrefix}>{largeDisplayParts.prefix}</span>
          <span className={styles.largeSelHeadingMain}>{largeDisplayParts.main}</span>
          <span className={styles.largeSelHeadingSuffix}>{largeDisplayParts.suffix}</span>
        </>
      ) : (
        <span className={styles.largeSelHeadingFallback}>{secondary}</span>
      )}
    </div>
  );
};

const LabelTile: React.FC<ILabelTileProps> = ({
  code,
  config,
  layoutMode = DEFAULT_LABEL_PRINT_MODE,
}) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode);
  const { typography } = layoutStrategy;
  const specialAisleValues = config.specialAisleValues;
  const { primary, secondary } = getPrimaryLabelText(
    code,
    config.backCodePrefix,
    specialAisleValues,
  );
  const labelValue = getEncodedLabelCode(code, config.backCodePrefix, specialAisleValues);
  const isLargeSel = layoutMode === 'large-sel';
  const primaryFontSizeMm = getMiniPrimaryFontSizeMm(primary, layoutStrategy);
  const primaryCenterFromContentTopMm = getMiniPrimaryCenterFromContentTopMm(typography);
  const secondaryTopFromContentTopMm = getMiniSecondaryTopFromContentTopMm(typography);

  return (
    <div className={isLargeSel ? styles.labelBoxLargeSel : styles.labelBox}>
      <div className={isLargeSel ? styles.largeSelLabelTextArea : styles.labelText}>
        {isLargeSel ? (
          <LargeSelTileContent
            code={code}
            secondary={secondary}
            backCodePrefix={config.backCodePrefix}
            specialAisleValues={specialAisleValues}
          />
        ) : (
          <MiniSelTileContent
            primary={primary}
            secondary={secondary}
            primaryFontSizeMm={primaryFontSizeMm}
            primaryCenterFromContentTopMm={primaryCenterFromContentTopMm}
            secondaryTopFromContentTopMm={secondaryTopFromContentTopMm}
          />
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
