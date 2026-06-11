import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './LabelApp.module.css';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, normalizeBackCodePrefix, normalizeSpecialAisleValue } from '../config/labelConfig';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy, LabelPrintMode } from '../models/ILabelLayoutStrategy';
import {
  buildCompactLabelCodePattern,
  buildCompactBackCodePattern,
  buildSeparatedLabelCodePattern,
  buildSeparatedBackCodePattern,
  buildSpacedLabelCodePattern,
  buildSpacedBackCodePattern,
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

const AISLE_CODE_PATTERN = buildCompactLabelCodePattern();
const SEPARATED_AISLE_CODE_PATTERN = buildSeparatedLabelCodePattern(true);
const SPACED_AISLE_CODE_PATTERN = buildSpacedLabelCodePattern(true);

const parseCompactAisleCode = (code: string): { zone: string; side: string; bay: string; shelf: string } | null => {
  const match = code.match(AISLE_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, zone, side, bay, shelf] = match;
  return { zone, side, bay, shelf };
};

const parseCompactBackCode = (code: string, backCodePrefix: string): { bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const match = code.match(buildCompactBackCodePattern(normalizedPrefix, true));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    bay,
    shelf: shelf.toUpperCase(),
  };
};

const parseSeparatedAisleCode = (code: string): { zone: string; side: string; bay: string; shelf: string } | null => {
  const match = code.match(SEPARATED_AISLE_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, zone, side, bay, shelf] = match;
  return { zone, side: side.toUpperCase(), bay, shelf: shelf.toUpperCase() };
};

const parseSpacedAisleCode = (code: string): { zone: string; side: string; bay: string; shelf: string } | null => {
  const match = code.match(SPACED_AISLE_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, zone, side, bay, shelf] = match;
  return { zone, side: side.toUpperCase(), bay, shelf: shelf.toUpperCase() };
};

const parseAisleCodeFromAny = (code: string): { zone: string; side: string; bay: string; shelf: string } | null => {
  const normalizedCode = code.toUpperCase();

  return (
    parseCompactAisleCode(normalizedCode)
    ?? parseSeparatedAisleCode(normalizedCode)
    ?? parseSpacedAisleCode(normalizedCode)
  );
};

const parseSeparatedBackCode = (code: string, backCodePrefix: string): { bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const match = code.match(buildSeparatedBackCodePattern(normalizedPrefix, true));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    bay,
    shelf: shelf.toUpperCase(),
  };
};

const parseSpacedBackCode = (code: string, backCodePrefix: string): { bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const match = code.match(buildSpacedBackCodePattern(normalizedPrefix, true));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    bay,
    shelf: shelf.toUpperCase(),
  };
};

const parseBackCodeFromAny = (code: string, backCodePrefix: string): { bay: string; shelf: string } | null => {
  const normalizedCode = code.toUpperCase();

  return (
    parseCompactBackCode(normalizedCode, backCodePrefix)
    ?? parseSeparatedBackCode(normalizedCode, backCodePrefix)
    ?? parseSpacedBackCode(normalizedCode, backCodePrefix)
  );
};

const getSecondaryDisplayValue = (code: string): string => {
  return code.replace(/-/g, ' ');
};

const formatSeparatedAisleCode = (zone: string, side: string, bay: string, shelf: string): string => {
  return `${zone}-${side}${bay}-${shelf}`;
};

const formatSeparatedBackCode = (prefix: string, bay: string, shelf: string): string => {
  return `${prefix}-${bay}-${shelf}`;
};

const compactAisleCode = (zone: string, side: string, bay: string, shelf: string): string => {
  return `${zone}${side}${bay}${shelf}`;
};

const compactBackCode = (prefix: string, bay: string, shelf: string): string => {
  return `${prefix}${bay}${shelf}`;
};

const getBackFallbackTokens = (code: string, backCodePrefix: string): { rawPrefix: string; bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const upperCode = code.toUpperCase().replace(/[- ]/g, '');
  const prefixLength = normalizedPrefix.length;

  if (upperCode.length <= prefixLength) {
    return null;
  }

  const bay = upperCode.slice(prefixLength, prefixLength + 2);
  const shelf = upperCode.slice(prefixLength + 2);

  return {
    rawPrefix: upperCode.slice(0, prefixLength),
    bay,
    shelf,
  };
};

export const normalizeLabelCode = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = code.toUpperCase();
  const specialAisle = normalizeSpecialAisleValue(normalizedCode, specialAisleValues);
  if (specialAisle) {
    return specialAisle;
  }

  const aisleCode = parseAisleCodeFromAny(normalizedCode);
  if (aisleCode) {
    const { zone, side, bay, shelf } = aisleCode;
    return formatSeparatedAisleCode(zone, side, bay, shelf);
  }

  const backCode = parseBackCodeFromAny(normalizedCode, normalizedPrefix);
  if (backCode) {
    const { bay, shelf } = backCode;
    return formatSeparatedBackCode(normalizedPrefix, bay, shelf);
  }

  if (type === 'Back') {
    const fallbackBackCode = getBackFallbackTokens(normalizedCode, normalizedPrefix);
    if (fallbackBackCode) {
      const { rawPrefix, bay, shelf } = fallbackBackCode;
      return formatSeparatedBackCode(rawPrefix, bay, shelf);
    }
  }

  return normalizedCode;
};

export const getEncodedLabelCode = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = code.toUpperCase();

  const specialAisle = normalizeSpecialAisleValue(normalizedCode, specialAisleValues);
  if (specialAisle) {
    return specialAisle;
  }

  const aisleCode = parseAisleCodeFromAny(normalizedCode);
  if (aisleCode) {
    const { zone, side, bay, shelf } = aisleCode;
    return compactAisleCode(zone, side, bay, shelf);
  }

  const backCode = parseBackCodeFromAny(normalizedCode, normalizedPrefix);
  if (backCode) {
    const { bay, shelf } = backCode;
    return compactBackCode(normalizedPrefix, bay, shelf);
  }

  if (type === 'Back') {
    const fallbackBackCode = getBackFallbackTokens(normalizedCode, normalizedPrefix);
    if (fallbackBackCode) {
      const { rawPrefix, bay, shelf } = fallbackBackCode;
      return compactBackCode(rawPrefix, bay, shelf);
    }
  }

  return normalizedCode.replace(/[- ]/g, '');
};

export const getPrimaryLabelText = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues?: readonly string[],
): { primary: string; secondary: string } => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const upperCode = code.toUpperCase();
  const specialAisle = normalizeSpecialAisleValue(upperCode, specialAisleValues);
  const secondaryDisplayValue = type === 'Specific'
    ? upperCode
    : getSecondaryDisplayValue(normalizeLabelCode(upperCode, type, normalizedPrefix, specialAisleValues));

  if (specialAisle) {
    return {
      primary: specialAisle,
      secondary: secondaryDisplayValue,
    };
  }

  const aisleCode = parseAisleCodeFromAny(upperCode);
  if (aisleCode) {
    const { side, bay } = aisleCode;
    return {
      primary: `${side}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  const backCode = parseBackCodeFromAny(upperCode, normalizedPrefix);
  if (backCode) {
    const { bay } = backCode;
    return {
      primary: `${normalizedPrefix}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  if (type === 'Back') {
    const fallbackBackCode = getBackFallbackTokens(upperCode, normalizedPrefix);
    if (fallbackBackCode) {
      const { bay } = fallbackBackCode;
      return {
        primary: `${normalizedPrefix}${bay}`,
        secondary: secondaryDisplayValue,
      };
    }
  }

  return {
    primary: upperCode,
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
): ILargeLabelDisplayParts | null => {
  const aisleCode = parseAisleCodeFromAny(code);
  if (aisleCode) {
    const { zone, side, bay, shelf } = aisleCode;
    return {
      prefix: `${zone} `,
      main: `${side}${bay}`,
      suffix: ` ${shelf}`,
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
  type?: string;
  backCodePrefix: string;
  specialAisleValues?: readonly string[];
}

const LargeSelLabelTileContent: React.FC<ILargeSelLabelTileContentProps> = ({
  code,
  secondary,
  type,
  backCodePrefix,
  specialAisleValues,
}) => {
  const largeDisplayParts = getLargeSelDisplayParts(code, type, backCodePrefix, specialAisleValues);

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
