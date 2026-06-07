import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './LabelApp.module.css';
import { ILabelConfig, SecondaryCodeFormat } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, normalizeBackCodePrefix, normalizeSpecialAisleValue } from '../config/labelConfig';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy, LabelPrintMode } from '../models/ILabelLayoutStrategy';
import {
  buildCompactAisleCodePattern,
  buildCompactBackCodePattern,
  buildDashedAisleCodePattern,
  buildDashedAisleSideBayPattern,
  buildDashedBackCodePattern,
} from './labelCodePatterns';
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

const AISLE_CODE_PATTERN = buildCompactAisleCodePattern();

const parseAisleCode = (code: string): { zone: string; side: string; bay: string; shelf: string } | null => {
  const match = code.match(AISLE_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, zone, side, bay, shelf] = match;
  return { zone, side, bay, shelf };
};

const parseBackCode = (code: string, backCodePrefix: string): { bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const match = code.match(buildCompactBackCodePattern(normalizedPrefix, true));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    bay,
    shelf,
  };
};

const getSecondaryDisplayValue = (_code: string, dashedCode: string, secondaryCodeFormat: SecondaryCodeFormat, _type?: string): string => {
  const rawSecondaryDisplayValue = secondaryCodeFormat === 'spaces' ? dashedCode.replace(/-/g, ' ') : dashedCode;
  return rawSecondaryDisplayValue;
};

const parseDashedBackCode = (parts: string[], backCodePrefix: string, type?: string): { bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  if (!(type === 'Back' || parts[0].toUpperCase() === normalizedPrefix)) {
    return null;
  }

  if (parts.length < 3) {
    return null;
  }

  const bay = parts[1];
  const shelf = parts[parts.length - 1];

  if (!/^\d{2}$/.test(bay)) {
    return null;
  }

  return { bay, shelf };
};

const DASHED_AISLE_CODE_PATTERN = buildDashedAisleCodePattern(true);

const normalizeSeparatorsForEncoding = (code: string): string => {
  return code.replace(/ /g, '-');
};

const tryEncodeDashedAisleCode = (dashedCode: string): string | null => {
  const dashedAisleMatch = dashedCode.match(DASHED_AISLE_CODE_PATTERN);
  if (!dashedAisleMatch) {
    return null;
  }

  const [, zone, side, bay, shelf] = dashedAisleMatch;
  return `${zone}${side.toUpperCase()}${bay}${shelf.toUpperCase()}`;
};

const tryEncodeDashedBackCode = (dashedCode: string, backCodePrefix: string): string | null => {
  const dashedBackMatch = dashedCode.match(buildDashedBackCodePattern(backCodePrefix, true));
  if (!dashedBackMatch) {
    return null;
  }

  const [, bay, shelf] = dashedBackMatch;
  return `${backCodePrefix}${bay}${shelf.toUpperCase()}`;
};

export const getDashedLabelCode = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const specialAisle = normalizeSpecialAisleValue(code, specialAisleValues);
  if (specialAisle) {
    return specialAisle;
  }

  if (code.includes('-')) {
    return code;
  }

  const aisleCode = parseAisleCode(code);
  if (aisleCode) {
    const { zone, side, bay, shelf } = aisleCode;
    return `${zone}-${side}${bay}-${shelf}`;
  }

  const backCode = parseBackCode(code, normalizedPrefix);
  if (backCode) {
    const { bay, shelf } = backCode;
    return `${normalizedPrefix}-${bay}-${shelf}`;
  }

  if (type === 'Back') {
    const fallbackBackCode = parseBackCode(code, normalizedPrefix);
    if (fallbackBackCode) {
      const { bay, shelf } = fallbackBackCode;
      return `${normalizedPrefix}-${bay}-${shelf}`;
    }

    const prefixLength = normalizedPrefix.length;

    return `${code.slice(0, prefixLength)}-${code.slice(prefixLength, prefixLength + 2)}-${code.slice(prefixLength + 2)}`;
  }

  return code;
};

export const getEncodedLabelCode = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = normalizeSeparatorsForEncoding(code);

  const specialAisle = normalizeSpecialAisleValue(normalizedCode, specialAisleValues);
  if (specialAisle) {
    return specialAisle;
  }

  const dashedCode = getDashedLabelCode(normalizedCode, type, normalizedPrefix, specialAisleValues);

  const encodedBackCode = tryEncodeDashedBackCode(dashedCode, normalizedPrefix);
  if (encodedBackCode) {
    return encodedBackCode;
  }

  const encodedAisleCode = tryEncodeDashedAisleCode(dashedCode);
  if (encodedAisleCode) {
    return encodedAisleCode;
  }

  return dashedCode;
};

export const getPrimaryLabelText = (
  code: string,
  secondaryCodeFormat: SecondaryCodeFormat,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): { primary: string; secondary: string } => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const specialAisle = normalizeSpecialAisleValue(code, specialAisleValues);
  const dashedCode = getDashedLabelCode(code, type, normalizedPrefix, specialAisleValues);
  const secondaryDisplayValue = getSecondaryDisplayValue(code, dashedCode, secondaryCodeFormat, type);

  if (specialAisle) {
    return {
      primary: dashedCode,
      secondary: secondaryDisplayValue,
    };
  }

  if (code.includes('-')) {
    const parts = code.split('-');

    const dashedBackCode = parseDashedBackCode(parts, normalizedPrefix, type);
    if (dashedBackCode) {
      const { bay } = dashedBackCode;
      return {
        primary: `${normalizedPrefix}${bay}`,
        secondary: secondaryDisplayValue,
      };
    }

    if (parts.length >= 3) {
      return {
        primary: parts.slice(1, -1).join('-'),
        secondary: secondaryDisplayValue,
      };
    }
  }

  const aisleCode = parseAisleCode(code);
  if (aisleCode) {
    const { side, bay } = aisleCode;
    return {
      primary: `${side}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  const backCode = parseBackCode(code, normalizedPrefix);
  if (backCode) {
    const { bay } = backCode;
    return {
      primary: `${normalizedPrefix}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  if (type === 'Back') {
    const fallbackBackCode = parseBackCode(code, normalizedPrefix);
    if (fallbackBackCode) {
      const { bay } = fallbackBackCode;
      return {
        primary: `${normalizedPrefix}${bay}`,
        secondary: secondaryDisplayValue,
      };
    }

    const prefixLength = normalizedPrefix.length;
    const bayToken = code.slice(prefixLength, prefixLength + 2);

    return {
      primary: `${normalizedPrefix}${bayToken}`,
      secondary: secondaryDisplayValue,
    };
  }

  return {
    primary: code,
    secondary: secondaryDisplayValue,
  };
};

export interface ILargeLabelDisplayParts {
  prefix: string;
  main: string;
  suffix: string;
}

export const getLargeSelDisplayParts = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
  secondaryCodeFormat: SecondaryCodeFormat = 'dashes',
): ILargeLabelDisplayParts | null => {
  const dashedCode = getDashedLabelCode(code, type, backCodePrefix, specialAisleValues);
  const dashedAisleMatch = dashedCode.match(buildDashedAisleSideBayPattern());

  if (dashedAisleMatch) {
    const [, aisle, sideBay, shelf] = dashedAisleMatch;
    const separator = secondaryCodeFormat === 'spaces' ? ' ' : '-';
    return {
      prefix: `${aisle}${separator}`,
      main: sideBay,
      suffix: `${separator}${shelf}`,
    };
  }

  return null;
};

interface ILabelTileProps {
  code: string;
  config: ILabelConfig;
  type?: string;
  layoutMode?: LabelPrintMode;
}

interface IMiniSelLabelTileContentProps {
  primary: string;
  secondary: string;
  primaryFontSizeMm: number;
  primaryCenterFromContentTopMm: number;
  secondaryTopFromContentTopMm: number;
}

const MiniSelLabelTileContent: React.FC<IMiniSelLabelTileContentProps> = ({
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

interface ILargeSelLabelTileContentProps {
  code: string;
  secondary: string;
  secondaryCodeFormat: SecondaryCodeFormat;
  type?: string;
  backCodePrefix: string;
  specialAisleValues?: readonly string[];
}

const LargeSelLabelTileContent: React.FC<ILargeSelLabelTileContentProps> = ({
  code,
  secondary,
  secondaryCodeFormat,
  type,
  backCodePrefix,
  specialAisleValues,
}) => {
  const largeDisplayParts = getLargeSelDisplayParts(code, type, backCodePrefix, specialAisleValues, secondaryCodeFormat);

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
  type,
  layoutMode = DEFAULT_LABEL_PRINT_MODE,
}) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode);
  const { typography } = layoutStrategy;
  const specialAisleValues = config.specialAisleValues;
  const { primary, secondary } = getPrimaryLabelText(
    code,
    config.secondaryCodeFormat,
    type,
    config.backCodePrefix,
    specialAisleValues,
  );
  const labelValue = getEncodedLabelCode(code, type, config.backCodePrefix, specialAisleValues);
  const isLargeSel = layoutMode === 'large-sel';
  const primaryFontSizeMm = getMiniPrimaryFontSizeMm(primary, layoutStrategy);
  const primaryCenterFromContentTopMm = getMiniPrimaryCenterFromContentTopMm(typography);
  const secondaryTopFromContentTopMm = getMiniSecondaryTopFromContentTopMm(typography);

  return (
    <div className={isLargeSel ? styles.labelBoxLargeSel : styles.labelBox}>
      <div className={isLargeSel ? styles.largeSelLabelTextArea : styles.labelText}>
        {isLargeSel ? (
          <LargeSelLabelTileContent
            code={code}
            secondary={secondary}
            secondaryCodeFormat={config.secondaryCodeFormat}
            type={type}
            backCodePrefix={config.backCodePrefix}
            specialAisleValues={specialAisleValues}
          />
        ) : (
          <MiniSelLabelTileContent
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
